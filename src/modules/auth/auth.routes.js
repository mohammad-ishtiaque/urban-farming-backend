const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimiter = require('../../middleware/rateLimiter');
const authenticate = require('../../middleware/auth');

// Registration & email verification
router.post('/register', rateLimiter, authController.register);
router.post('/verify-email', rateLimiter, authController.verifyEmail);
router.post('/resend-otp', rateLimiter, authController.resendVerificationOtp);

// Login
router.post('/login', rateLimiter, authController.login);

// Authenticated routes
router.get('/my-profile', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

// Password reset via OTP
router.post('/forgot-password', rateLimiter, authController.forgotPassword);
router.post('/reset-password', rateLimiter, authController.resetPassword);

module.exports = router;
