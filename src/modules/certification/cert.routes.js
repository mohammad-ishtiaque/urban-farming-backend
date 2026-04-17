const express = require('express');
const router = express.Router();
const certController = require('./cert.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

router.post('/', authenticate, roleGuard('VENDOR'), certController.submitCert);
router.get('/my', authenticate, roleGuard('VENDOR'), certController.getMyCerts);

module.exports = router;