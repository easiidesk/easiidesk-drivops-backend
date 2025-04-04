import { userService } from '../services/userService.js';

async function getUsers(request,env,ctx) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit'), 10) || 10;
        const offset = parseInt(url.searchParams.get('offset'), 10) || 0;

        // Pass env to the service layer
        const { users, totalCount } = await userService.getAllUsers({ limit, offset }, env);

        // Prepare the JSON response payload
        const responsePayload = {
            message: 'Users retrieved successfully',
            data: users,
            pagination: {
                limit,
                offset,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };

        // Return a standard Response object
        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error in userController.getUsers:", error);
        // Consider logging the specific error type/message
        const errorMessage = error instanceof Error ? error.message : 'Error retrieving users';
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: error.message === 'Missing Supabase credentials in worker environment.' ? 500 : (error.message === 'User not found' ? 404 : 500), // Example status mapping
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Add other controller functions (createUser, getUserById, etc.) later,
// making sure they accept `request` and return a `Response`.

export const userController = {
    getUsers,
}; 