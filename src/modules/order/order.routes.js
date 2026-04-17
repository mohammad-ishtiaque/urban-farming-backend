const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

// Customer
router.post('/', authenticate, roleGuard('CUSTOMER'), orderController.createOrder);
router.get('/my', authenticate, roleGuard('CUSTOMER'), orderController.getMyOrders);

// Vendor
router.get('/vendor', authenticate, roleGuard('VENDOR'), orderController.getVendorOrders);
router.put('/:id/status', authenticate, roleGuard('VENDOR'), orderController.updateOrderStatus);

module.exports = router;