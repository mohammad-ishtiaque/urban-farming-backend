const prisma = require('../../config/prisma');

// ─── CUSTOMER PROFILE ────────────────────────────────────
const getCustomerProfile = async (userId) => {
  let profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, role: true, createdAt: true } } },
  });

  // Auto-create if doesn't exist
  if (!profile) {
    profile = await prisma.customerProfile.create({
      data: { userId },
      include: { user: { select: { name: true, email: true, role: true, createdAt: true } } },
    });
  }
  return profile;
};

const updateCustomerProfile = async (userId, body) => {
  const { name, phone, address, bio, avatarUrl } = body;

  const profile = await prisma.customerProfile.upsert({
    where: { userId },
    create: { userId, phone, address, bio, avatarUrl },
    update: { phone, address, bio, avatarUrl },
  });

  // Update name on User table too
  if (name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  return profile;
};

// ─── VENDOR PROFILE ──────────────────────────────────────
const createVendorProfile = async (userId, body) => {
  const { farmName, farmLocation } = body;

  if (!farmName || !farmLocation) {
    throw { status: 400, message: 'Farm name and farm location are required' };
  }

  const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (existing) {
    throw { status: 409, message: 'Vendor profile already exists. Use PUT to update it.' };
  }

  const profile = await prisma.vendorProfile.create({
    data: { userId, farmName, farmLocation },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
    },
  });

  return profile;
};

const getVendorProfile = async (userId) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      certifications: true,
      produce: { take: 5, orderBy: { id: 'desc' } },
    },
  });
  if (!profile) throw { status: 404, message: 'Vendor profile not found. Create one first.' };
  return profile;
};

const updateVendorProfile = async (userId, body) => {
  const { name, farmName, farmLocation } = body;

  const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!profile) throw { status: 404, message: 'Vendor profile not found' };

  const updated = await prisma.vendorProfile.update({
    where: { userId },
    data: {
      farmName: farmName || profile.farmName,
      farmLocation: farmLocation || profile.farmLocation,
    },
  });

  if (name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  return updated;
};

// ─── ADMIN PROFILE ───────────────────────────────────────
const getAdminProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
};

const updateAdminProfile = async (userId, body) => {
  const { name } = body;
  if (!name) throw { status: 400, message: 'Name is required' };

  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true, email: true, role: true },
  });
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  createVendorProfile,
  getVendorProfile,
  updateVendorProfile,
  getAdminProfile,
  updateAdminProfile,
};