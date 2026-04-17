const express = require('express');
const router = express.Router();
const farmController = require('./farm.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

// Public
router.get('/', farmController.getAllFarms);
router.get('/:id', farmController.getFarmById);

// Vendor only
router.post('/profile', authenticate, roleGuard('VENDOR'), farmController.createVendorProfile);
router.post('/', authenticate, roleGuard('VENDOR'), farmController.createFarm);
router.put('/:id', authenticate, roleGuard('VENDOR'), farmController.updateFarm);
router.delete('/:id', authenticate, roleGuard('VENDOR'), farmController.deleteFarm);

module.exports = router;