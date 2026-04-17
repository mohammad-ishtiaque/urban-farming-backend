const adminService = require('./admin.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const getAllUsers = async (req, res) => {
  try {
    const result = await adminService.getAllUsers();
    return sendSuccess(res, 200, 'Users fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const result = await adminService.updateUserStatus(req.user.userId, req.params.id, req.body);
    return sendSuccess(res, 200, 'User status updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const approveProduce = async (req, res) => {
  try {
    const result = await adminService.approveProduce(req.params.id, req.body);
    return sendSuccess(res, 200, 'Produce certification updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const approveVendor = async (req, res) => {
  try {
    const result = await adminService.approveVendor(req.params.id, req.body);
    return sendSuccess(res, 200, 'Vendor certification updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    const result = await adminService.getDashboard();
    return sendSuccess(res, 200, 'Dashboard data', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { getAllUsers, updateUserStatus, approveProduce, approveVendor, getDashboard };