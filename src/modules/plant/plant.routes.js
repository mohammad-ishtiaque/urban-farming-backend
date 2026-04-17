// src/modules/plant/plant.routes.js
const express = require('express');
const router = express.Router();
const plantController = require('./plant.controller');
const authenticate = require('../../middleware/auth');

// Any logged-in user can track their plants
router.get('/', authenticate, plantController.getMyPlants);
router.post('/', authenticate, plantController.addPlant);
router.put('/:id', authenticate, plantController.updatePlant);
router.delete('/:id', authenticate, plantController.deletePlant);

module.exports = router;