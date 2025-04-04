import { Router } from 'itty-router';
// Adjusted import path if needed
import { userController } from './controllers/userController.js';

// Create a new router
const router = Router();

// Add a specific root route for testing
router.get('/', () => new Response('Root OK - Using Supabase', { status: 200 }));

// Define API routes using the /api prefix
router.get('/api/users', userController.getUsers);
// Add other user routes as needed:
// router.post('/api/users', userController.createUser);
// router.get('/api/users/:id', userController.getUserById);
// etc.

// Catch-all for 404s - this should come *after* specific routes
router.all('*', () => new Response('Not Found', { status: 404 }));

// Fetch handler for the Worker
export default router;