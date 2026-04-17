// src/modules/plant/plant.controller.js
const plantService = require('./plant.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const getMyPlants = async (req, res) => {
  try {
    const result = await plantService.getMyPlants(req.user.userId);
    return sendSuccess(res, 200, 'Plants fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const addPlant = async (req, res) => {
  try {
    const result = await plantService.addPlant(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Plant added', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const updatePlant = async (req, res) => {
  try {
    const result = await plantService.updatePlant(req.user.userId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Plant updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const deletePlant = async (req, res) => {
  try {
    const result = await plantService.deletePlant(req.user.userId, req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { getMyPlants, addPlant, updatePlant, deletePlant };