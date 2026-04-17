const produceService = require('./produce.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const getAllProduce = async (req, res) => {
  try {
    const result = await produceService.getAllProduce(req.query);
    return sendSuccess(res, 200, 'Produce fetched successfully', result.items, result.meta);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getProduceById = async (req, res) => {
  try {
    const result = await produceService.getProduceById(req.params.id);
    return sendSuccess(res, 200, 'Produce fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const createProduce = async (req, res) => {
  try {
    const result = await produceService.createProduce(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Produce listed successfully', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const updateProduce = async (req, res) => {
  try {
    const result = await produceService.updateProduce(req.user.userId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Produce updated successfully', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const deleteProduce = async (req, res) => {
  try {
    const result = await produceService.deleteProduce(req.user.userId, req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getMyProduce = async (req, res) => {
  try {
    const result = await produceService.getMyProduce(req.user.userId);
    return sendSuccess(res, 200, 'Your produce fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = {
  getAllProduce,
  getProduceById,
  createProduce,
  updateProduce,
  deleteProduce,
  getMyProduce,
};