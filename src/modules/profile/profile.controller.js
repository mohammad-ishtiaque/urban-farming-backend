// src/modules/profile/profile.controller.js
const profileService = require('./profile.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const setupVendorProfile = async (req, res) => {
  try {
    const result = await profileService.createVendorProfile(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Vendor profile created successfully', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getProfile = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let result;

    if (role === 'CUSTOMER') result = await profileService.getCustomerProfile(userId);
    else if (role === 'VENDOR') result = await profileService.getVendorProfile(userId);
    else if (role === 'ADMIN') result = await profileService.getAdminProfile(userId);

    return sendSuccess(res, 200, 'Profile fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let result;

    if (role === 'CUSTOMER') result = await profileService.updateCustomerProfile(userId, req.body);
    else if (role === 'VENDOR') result = await profileService.updateVendorProfile(userId, req.body);
    else if (role === 'ADMIN') result = await profileService.updateAdminProfile(userId, req.body);

    return sendSuccess(res, 200, 'Profile updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { setupVendorProfile, getProfile, updateProfile };