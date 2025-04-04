import express from 'express';
import userRoutes from './userRoutes.js';
// Import other route files as you create them
// import productRoutes from './productRoutes.js';

const router = express.Router();

// Mount entity-specific routes under a base path (e.g., /api)
router.use('/users', userRoutes);
// router.use('/products', productRoutes);

// Simple health check or root endpoint for the API
router.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});


export default router; 