const express = require('express');
const router = express.Router();
const produceController = require('./produce.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

// Public routes
router.get('/', produceController.getAllProduce);
router.get('/:id', produceController.getProduceById);

// Vendor only routes
router.post('/', authenticate, roleGuard('VENDOR'), produceController.createProduce);
router.get('/vendor/my', authenticate, roleGuard('VENDOR'), produceController.getMyProduce);
router.put('/:id', authenticate, roleGuard('VENDOR'), produceController.updateProduce);
router.delete('/:id', authenticate, roleGuard('VENDOR'), produceController.deleteProduce);

module.exports = router;