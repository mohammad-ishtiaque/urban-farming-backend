const express = require('express');
const router = express.Router();
const communityController = require('./community.controller');
const authenticate = require('../../middleware/auth');

// Public
router.get('/', communityController.getAllPosts);

// Any logged-in user
router.post('/', authenticate, communityController.createPost);
router.delete('/:id', authenticate, communityController.deletePost);

module.exports = router;