// src/middleware/roleGuard.js
const { sendError } = require('../utils/apiResponse');

const roleGuard = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return sendError(res, 403, 'Access denied');
  next();
};

module.exports = roleGuard;