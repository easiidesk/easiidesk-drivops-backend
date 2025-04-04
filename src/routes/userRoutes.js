import { Router } from 'itty-router';
import { userController } from '../controllers/userController.js';

const router = Router();

router.get('/', userController.getUsers);

// You can add more routes here later:
// router.post('/', userController.createUser);
// router.get('/:id', userController.getUserById);
// router.patch('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser); // soft delete typically

export default router; // Export the router instance 