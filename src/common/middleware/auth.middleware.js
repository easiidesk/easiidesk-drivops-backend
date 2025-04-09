const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { errorResponse } = require('../responses/response.utils');
const env = require('../../config/env');

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json(errorResponse('No token provided', 401));
    }
    
    try {
      // Verify token with JWT
      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      // Check if user exists and is active
      const userModel = require('../../models/user.model');
      const user = await userModel.findOne({ 
        _id: new ObjectId(decoded.userId),
        isActive: true,
        deletedAt: null
      });
      
      if (!user) {
        return res.status(403).json(errorResponse('User is inactive or deleted', 403));
      }
      
      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        phone: user.phone,
        role: user.role,
        name: user.name
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(errorResponse('Token expired', 401));
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(errorResponse('Invalid token', 401));
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json(errorResponse('Internal server error', 500));
  }
};

/**
 * Role-based access control middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Not authenticated', 401));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('Insufficient privileges', 403));
    }
    
    next();
  };
};


module.exports = {
  verifyToken,
  authorize
}; 