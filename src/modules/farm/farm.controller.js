const farmService = require('./farm.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const getAllFarms = async (req, res) => {
  try {
    const result = await farmService.getAllFarms(req.query);
    return sendSuccess(res, 200, 'Farms fetched', result.items, result.meta);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getFarmById = async (req, res) => {
  try {
    const result = await farmService.getFarmById(req.params.id);
    return sendSuccess(res, 200, 'Farm fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const createFarm = async (req, res) => {
  try {
    const result = await farmService.createFarm(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Farm space created', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const updateFarm = async (req, res) => {
  try {
    const result = await farmService.updateFarm(req.user.userId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Farm updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const deleteFarm = async (req, res) => {
  try {
    const result = await farmService.deleteFarm(req.user.userId, req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const createVendorProfile = async (req, res) => {
  try {
    const result = await farmService.createVendorProfile(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Vendor profile created', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { getAllFarms, getFarmById, createFarm, updateFarm, deleteFarm, createVendorProfile };