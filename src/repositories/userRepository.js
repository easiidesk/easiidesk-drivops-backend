import { getSupabaseClient } from '../config/supabaseClient.js';

const TABLE_NAME = 'users';

// Note: We are defining the expected shape via JSDoc, similar to before.
/**
 * @typedef {object} User
 * @property {string} id - Unique identifier (UUID)
 * @property {string} email - User's unique email address
 * @property {string} [password] - Hashed password (often excluded from selects)
 * @property {string | null} [name] - User's full name
 * @property {string} role - User role (e.g., 'super-admin', 'user')
 * @property {string | null} [phone] - User's contact phone number
 * @property {boolean} is_active - If the user account is active
 * @property {string | Date} created_at - Timestamp of creation (ISO string or Date object)
 * @property {string | Date} updated_at - Timestamp of last update (ISO string or Date object)
 * @property {string | Date | null} [deleted_at] - Timestamp of soft deletion (null if not deleted)
 * @property {string[] | null} [fcm_tokens] - Array of Firebase Cloud Messaging tokens
 */


/**
 * Retrieves all non-deleted users with pagination.
 * @param {object} options - Optional query parameters.
 * @param {number} [options.limit=10] - Max number of users to return.
 * @param {number} [options.offset=0] - Number of users to skip.
 * @param {object} env - The worker environment object.
 * @returns {Promise<{ users: User[], totalCount: number | null }>} An object containing the array of user objects and the total count (if requested).
 * @throws {Error} If the database operation fails.
 */
async function findAll({ limit = 10, offset = 0 } = {}, env) {
    const supabase = getSupabaseClient(env); // Get client instance
    const selectColumns = 'id, email, name, role, phone, is_active, created_at, updated_at, fcm_tokens';

    const query = supabase
        .from(TABLE_NAME)
        .select(selectColumns, { count: 'exact' }) // Request count along with data
        .is('deleted_at', null) // Filter out soft-deleted users
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching all users:', error);
        throw new Error(`Could not fetch users: ${error.message}`);
    }

    // Supabase returns the count when { count: 'exact' } is used
    return { users: data || [], totalCount: count };
}


// Add other repository functions (create, findById, findByEmail, update, delete) using Supabase syntax:
/**
 * Finds a user by their ID.
 * @param {string} id - The UUID of the user to find.
 * @param {object} env - The worker environment object.
 * @returns {Promise<User | null>} The user object or null if not found.
 * @throws {Error} If the database operation fails unexpectedly.
 */
async function findById(id, env) {
    const supabase = getSupabaseClient(env); // Get client instance
    const selectColumns = 'id, email, name, role, phone, is_active, created_at, updated_at, fcm_tokens';
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(selectColumns)
        .eq('id', id)
        .maybeSingle(); // Returns null if not found, instead of an error

    if (error) {
        console.error(`Error fetching user by id [${id}]:`, error.message);
        throw new Error(`Could not fetch user by ID: ${error.message}`);
    }
    return data;
}

// Example: Create (Remember password hashing needs to happen in the service layer using Web Crypto)
/**
 * Creates a new user. Password should be pre-hashed.
 * @param {Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>} userData
 * @param {object} env - The worker environment object.
 * @returns {Promise<User>} The created user.
 */
async function create(userData, env) {
     const supabase = getSupabaseClient(env); // Get client instance
     const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(userData)
        .select() // Select the newly inserted row
        .single(); // Expecting a single row back

     if (error) {
        console.error(`Error creating user [${userData.email}]:`, error.message);
         // Check for Supabase specific errors, e.g., unique constraint violation (code '23505')
        if (error.code === '23505') {
             throw new Error(`User with email ${userData.email} already exists.`);
        }
        throw new Error(`Could not create user: ${error.message}`);
    }
    return data;
}

/**
 * Finds a user by their email address.
 * Includes password for authentication purposes.
 * @param {string} email - The email address to search for.
 * @param {object} env - The worker environment object.
 * @returns {Promise<User | null>} The user object (including password) or null if not found.
 * @throws {Error} If the database operation fails unexpectedly.
 */
async function findByEmail(email, env) {
     const supabase = getSupabaseClient(env); // Get client instance
     try {
        const user = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('email', email)
            .maybeSingle();
        return user; // Returns null if not found
    } catch (error) {
        console.error(`Error fetching user by email [${email}]:`, error);
        throw new Error(`Could not fetch user by email: ${error.message}`);
    }
}

/**
 * Updates a user's data by their ID. Automatically handles `updated_at`.
 * @param {string} id - The UUID of the user to update.
 * @param {Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>} updateData - An object containing the fields to update.
 * @param {object} env - The worker environment object.
 * @returns {Promise<User | null>} The updated user object or null if not found/update fails.
 * @throws {Error} If the update fails.
 */
async function update(id, updateData, env) {
    const supabase = getSupabaseClient(env); // Get client instance
    // Ensure sensitive or immutable fields are not accidentally updated
    // Supabase handles `updated_at` automatically. `created_at` and `id` can't be updated.
    const { password, email, ...safeUpdateData } = updateData; // Example: prevent direct password/email update here
                                                                // Handle password hashing/email changes in the service layer if needed.

    if (Object.keys(safeUpdateData).length === 0) {
        console.warn(`Update request for user [${id}] had no valid fields to update.`);
        // Find and return existing user without attempting update
        return findById(id, env);
    }

    try {
        const { data: updatedUser, error } = await supabase
            .from(TABLE_NAME)
            .update(safeUpdateData)
            .eq('id', id)
            .select('*')
            .single();
        return updatedUser;
    } catch (error) {
         // Handle specific errors like record not found (P2025)
        if (error.code === 'P2025') {
             console.warn(`Attempted to update non-existent user [${id}]`);
             return null;
        }
        console.error(`Error updating user [${id}]:`, error);
        throw new Error(`Could not update user: ${error.message}`);
    }
}

/**
 * Soft deletes a user by setting the deleted_at timestamp.
 * @param {string} id - The UUID of the user to soft delete.
 * @param {object} env - The worker environment object.
 * @returns {Promise<boolean>} True if the user was soft-deleted, false otherwise (e.g., not found or already deleted).
 * @throws {Error} If the database operation fails.
 */
async function softDelete(id, env) {
     const supabase = getSupabaseClient(env); // Get client instance
     const { count, error } = await supabase
        .from(TABLE_NAME)
        .update({ deleted_at: new Date().toISOString() }) // Use ISO string for timestamp
        .eq('id', id)
        .is('deleted_at', null); // Ensure we only update if not already deleted

    if (error) {
        console.error(`Error soft deleting user [${id}]:`, error);
        throw new Error(`Could not soft delete user: ${error.message}`);
    }
    // The 'count' returned by Supabase update indicates rows affected
    return count > 0;
}

/**
 * Permanently deletes a user from the database. Use with caution!
 * @param {string} id - The UUID of the user to delete permanently.
 * @param {object} env - The worker environment object.
 * @returns {Promise<boolean>} True if the user was deleted, false otherwise (e.g., not found).
 * @throws {Error} If the database operation fails.
 */
async function hardDelete(id, env) {
    const supabase = getSupabaseClient(env); // Get client instance
    const { count, error } = await supabase
        .from(TABLE_NAME)
        .delete({ count: 'exact' }) // Request count
        .eq('id', id);

    if (error) {
        console.error(`Error hard deleting user [${id}]:`, error);
        throw new Error(`Could not permanently delete user: ${error.message}`);
    }
    return count > 0;
}

export const userRepository = {
    findAll,
    findById,
    findByEmail,
    create,
    update,
    softDelete,
    hardDelete,
}; 