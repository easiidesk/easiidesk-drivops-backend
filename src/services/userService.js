import { userRepository } from '../repositories/userRepository.js';

async function createUser(userData, env) {
    // 1. Input validation (basic checks, more complex validation might be in middleware or controller)
    if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
    }

    // 2. Business Logic (e.g., hash password)
    // const hashedPassword = await bcrypt.hash(userData.password, 10); // Salt rounds = 10
    console.warn("Password hashing not implemented. Storing plain text (DO NOT DO THIS IN PRODUCTION)");
    const hashedPassword = userData.password; // TEMPORARY - REPLACE ME

    const processedUserData = {
        ...userData,
        password: hashedPassword, // Use the actual hashed password
    };

    // 3. Call Repository
    try {
        // Pass env to the repository function
        const newUser = await userRepository.create(processedUserData, env);
        // 4. Post-processing (e.g., remove sensitive data before returning)
        delete newUser.password; // Never return the password hash unless needed
        return newUser;
    } catch (error) {
        // Handle specific repository errors (e.g., unique constraint violation)
         if (error.message.includes('duplicate key value violates unique constraint')) {
             throw new Error('Email already exists.');
         }
        console.error("Error in userService.createUser:", error);
        throw error; // Re-throw or handle appropriately
    }
}


async function getUserById(userId, env) {
    // Maybe add caching logic here later
    try {
        // Pass env to the repository function
        const user = await userRepository.findById(userId, env);
         if (!user) {
            throw new Error('User not found'); // Or return null depending on desired behavior
        }
        // Password should already be excluded by repository select, but double-check
        delete user.password;
        return user;
    } catch (error) {
        console.error(`Error in userService.getUserById for ID ${userId}:`, error);
        throw error; // Re-throw or handle
    }
}


async function getAllUsers({ limit, offset } = {}, env) {
    try {
        // Pass env to the repository function
        const result = await userRepository.findAll({ limit, offset }, env);
        // Data processing if needed (e.g., formatting dates)
        return result;
    } catch (error) {
        console.error("Error in userService.getAllUsers:", error);
        throw error; // Re-throw to be caught by the controller
    }
}

// ... other user-related business logic functions

export const userService = {
    createUser,
    getUserById,
    getAllUsers,
    // ... export other functions
}; 