const communityService = require('./community.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const getAllPosts = async (req, res) => {
  try {
    const result = await communityService.getAllPosts(req.query);
    return sendSuccess(res, 200, 'Posts fetched', result.items, result.meta);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const createPost = async (req, res) => {
  try {
    const result = await communityService.createPost(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Post created', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const result = await communityService.deletePost(req.user.userId, req.params.id, req.user.role);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { getAllPosts, createPost, deletePost };