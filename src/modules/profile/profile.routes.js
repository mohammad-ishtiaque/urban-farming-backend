const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

router.post('/setup', authenticate, roleGuard('VENDOR'), profileController.setupVendorProfile);


router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, profileController.updateProfile);

module.exports = router;