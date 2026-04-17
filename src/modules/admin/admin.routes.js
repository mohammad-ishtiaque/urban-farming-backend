const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

// All admin routes protected
router.use(authenticate, roleGuard('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/produce/:id/approve', adminController.approveProduce);
router.put('/vendors/:id/approve', adminController.approveVendor);

module.exports = router;