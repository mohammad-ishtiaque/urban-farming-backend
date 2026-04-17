const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { sendMail } = require('../../config/mailer');

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpExpiresAt = () => new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const signToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const invalidatePreviousOtps = async (userId, type) => {
  await prisma.otpToken.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });
};

const sendOtpEmail = async ({ to, name, otp, type }) => {
  const isReset = type === 'PASSWORD_RESET';
  const subject = isReset
    ? 'Your Password Reset OTP — Urban Farming'
    : 'Verify Your Email — Urban Farming';

  const heading = isReset ? 'Reset Your Password' : 'Verify Your Email';
  const body = isReset
    ? 'Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.'
    : 'Use the OTP below to verify your account. It expires in <strong>10 minutes</strong>.';

  await sendMail({
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
        <div style="background:#2d7a2d;padding:24px 32px;">
          <h2 style="color:#fff;margin:0;">Urban Farming Platform</h2>
        </div>
        <div style="padding:32px;">
          <p style="margin-top:0;">Hello <strong>${name}</strong>,</p>
          <p>${body}</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#2d7a2d;">${otp}</span>
          </div>
          <p style="color:#666;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
          <p style="color:#666;font-size:13px;">— Urban Farming Team</p>
        </div>
      </div>
    `,
  });
};

// ─── Register ────────────────────────────────────────────────────────────────

const register = async (body) => {
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    throw { status: 400, message: 'Name, email and password are required' };
  }
  if (!isValidEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }
  if (password.length < 6) {
    throw { status: 400, message: 'Password must be at least 6 characters' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.status === 'ACTIVE') {
      throw { status: 409, message: 'Email already registered' };
    }
    // PENDING: resend OTP so they can verify
    await invalidatePreviousOtps(existing.id, 'EMAIL_VERIFY');
    const otp = generateOtp();
    await prisma.otpToken.create({
      data: {
        userId: existing.id,
        otp,
        type: 'EMAIL_VERIFY',
        expiresAt: otpExpiresAt(),
      },
    });
    await sendOtpEmail({ to: existing.email, name: existing.name, otp, type: 'EMAIL_VERIFY' });
    return {
      message: 'Account already registered but not verified. A new OTP has been sent to your email.',
    };
  }

  const allowedRoles = ['CUSTOMER', 'VENDOR'];
  const userRole = allowedRoles.includes(role) ? role : 'CUSTOMER';
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: userRole, status: 'PENDING' },
  });

  const otp = generateOtp();
  await prisma.otpToken.create({
    data: { userId: user.id, otp, type: 'EMAIL_VERIFY', expiresAt: otpExpiresAt() },
  });

  await sendOtpEmail({ to: user.email, name: user.name, otp, type: 'EMAIL_VERIFY' });

  return {
    message: 'Registration successful. Please check your email for the OTP to verify your account.',
    userId: user.id,
  };
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────

const verifyEmail = async (body) => {
  const { email, otp } = body;

  if (!email || !otp) {
    throw { status: 400, message: 'Email and OTP are required' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (user.status === 'ACTIVE') {
    throw { status: 400, message: 'Email is already verified' };
  }
  if (user.status === 'INACTIVE') {
    throw { status: 403, message: 'Account has been deactivated' };
  }

  const otpRecord = await prisma.otpToken.findFirst({
    where: { userId: user.id, type: 'EMAIL_VERIFY', used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw { status: 400, message: 'No active OTP found. Please request a new one.' };
  }
  if (new Date() > otpRecord.expiresAt) {
    throw { status: 400, message: 'OTP has expired. Please request a new one.' };
  }
  if (otpRecord.otp !== otp) {
    throw { status: 400, message: 'Invalid OTP' };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } }),
    prisma.otpToken.update({ where: { id: otpRecord.id }, data: { used: true } }),
  ]);

  const token = signToken(user);

  return {
    message: 'Email verified successfully. You are now logged in.',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

// ─── Resend Email Verification OTP ───────────────────────────────────────────

const resendVerificationOtp = async (body) => {
  const { email } = body;

  if (!email) throw { status: 400, message: 'Email is required' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (user.status === 'ACTIVE') {
    throw { status: 400, message: 'Email is already verified' };
  }
  if (user.status === 'INACTIVE') {
    throw { status: 403, message: 'Account has been deactivated' };
  }

  await invalidatePreviousOtps(user.id, 'EMAIL_VERIFY');

  const otp = generateOtp();
  await prisma.otpToken.create({
    data: { userId: user.id, otp, type: 'EMAIL_VERIFY', expiresAt: otpExpiresAt() },
  });

  await sendOtpEmail({ to: user.email, name: user.name, otp, type: 'EMAIL_VERIFY' });

  return { message: 'A new OTP has been sent to your email.' };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (body) => {
  const { email, password } = body;

  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw { status: 401, message: 'Invalid credentials' };

  if (user.status === 'PENDING') {
    throw {
      status: 403,
      message: 'Please verify your email first. Check your inbox for the OTP.',
    };
  }
  if (user.status === 'INACTIVE') {
    throw { status: 403, message: 'Account has been deactivated' };
  }

  const token = signToken(user);

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      vendorProfile: true,
    },
  });
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
};

// ─── Forgot Password (sends OTP) ─────────────────────────────────────────────

const forgotPassword = async (body) => {
  const { email } = body;
  if (!email) throw { status: 400, message: 'Email is required' };

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return same message to prevent email enumeration
  if (!user) {
    return { message: 'If this email is registered, you will receive an OTP shortly.' };
  }

  if (user.status === 'PENDING') {
    throw {
      status: 403,
      message: 'Please verify your email first before resetting your password.',
    };
  }
  if (user.status === 'INACTIVE') {
    throw { status: 403, message: 'Account has been deactivated' };
  }

  await invalidatePreviousOtps(user.id, 'PASSWORD_RESET');

  const otp = generateOtp();
  await prisma.otpToken.create({
    data: { userId: user.id, otp, type: 'PASSWORD_RESET', expiresAt: otpExpiresAt() },
  });

  await sendOtpEmail({ to: user.email, name: user.name, otp, type: 'PASSWORD_RESET' });

  return { message: 'If this email is registered, you will receive an OTP shortly.' };
};

// ─── Reset Password with OTP ─────────────────────────────────────────────────

const resetPassword = async (body) => {
  const { email, otp, newPassword } = body;

  if (!email || !otp || !newPassword) {
    throw { status: 400, message: 'Email, OTP and new password are required' };
  }
  if (newPassword.length < 6) {
    throw { status: 400, message: 'Password must be at least 6 characters' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 404, message: 'User not found' };

  const otpRecord = await prisma.otpToken.findFirst({
    where: { userId: user.id, type: 'PASSWORD_RESET', used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw { status: 400, message: 'No active OTP found. Please request a new one.' };
  }
  if (new Date() > otpRecord.expiresAt) {
    throw { status: 400, message: 'OTP has expired. Please request a new one.' };
  }
  if (otpRecord.otp !== otp) {
    throw { status: 400, message: 'Invalid OTP' };
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    prisma.otpToken.update({ where: { id: otpRecord.id }, data: { used: true } }),
  ]);

  return { message: 'Password reset successful. You can now log in.' };
};

// ─── Change Password (authenticated) ─────────────────────────────────────────

const changePassword = async (userId, body) => {
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    throw { status: 400, message: 'Current and new password are required' };
  }
  if (newPassword.length < 6) {
    throw { status: 400, message: 'New password must be at least 6 characters' };
  }
  if (currentPassword === newPassword) {
    throw { status: 400, message: 'New password must be different from current password' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw { status: 400, message: 'Current password is incorrect' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return { message: 'Password changed successfully' };
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationOtp,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
