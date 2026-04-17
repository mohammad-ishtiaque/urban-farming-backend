// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return sendError(res, 401, 'No token provided');

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

module.exports = authenticate;