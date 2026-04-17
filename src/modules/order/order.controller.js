const orderService = require('./order.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Order placed successfully', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const result = await orderService.getMyOrders(req.user.userId, req.query);
    return sendSuccess(res, 200, 'Orders fetched', result.items, result.meta);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const result = await orderService.updateOrderStatus(req.user.userId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Order status updated', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const result = await orderService.getVendorOrders(req.user.userId, req.query);
    return sendSuccess(res, 200, 'Vendor orders fetched', result.items, result.meta);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { createOrder, getMyOrders, updateOrderStatus, getVendorOrders };