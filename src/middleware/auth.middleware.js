const jwt = require('jsonwebtoken');
const { errorResponse } = require('../common/responses/response.utils');
const env = require('../config/env');
const User = require('../models/user.model');

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  // Get token from header
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  // Check if token exists
  if (!token) {
    return res.status(401).json(
      errorResponse('No authentication token provided', 401)
    );
  }
  
  try {
    // Remove Bearer prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Verify token
    const decoded = jwt.verify(tokenValue, env.JWT_SECRET);
    
    // Check if user exists in database
    const user = await User.findOne({ 
      _id: decoded.userId,
      isActive: true,
      deletedAt: null
    });
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not found or inactive', 401)
      );
    }
    
    // Add complete user object to request
    req.user = user;
    
    // Also add decoded token info
    req.token = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json(
      errorResponse('Invalid or expired token', 401)
    );
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    // Verify user exists in request and has a role
    if (!req.user || !req.user.role) {
      return res.status(401).json(
        errorResponse('Unauthorized', 401)
      );
    }
    
    // Check if user's role is in the allowed roles list
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Forbidden - insufficient permissions', 403)
      );
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  authorize
}; 