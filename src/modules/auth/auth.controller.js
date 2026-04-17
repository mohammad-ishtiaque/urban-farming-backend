const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, 201, result.message, result.userId ? { userId: result.userId } : null);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.body);
    return sendSuccess(res, 200, result.message, { token: result.token, user: result.user });
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const resendVerificationOtp = async (req, res) => {
  try {
    const result = await authService.resendVerificationOtp(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getMe = async (req, res) => {
  try {
    const result = await authService.getMe(req.user.userId);
    return sendSuccess(res, 200, 'Profile fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
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
