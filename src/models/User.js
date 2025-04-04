/**
 * Represents a User object structure.
 * This is primarily for documentation and consistency.
 * Actual Supabase results might have slightly different structures based on selects.
 *
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

// This file primarily serves as documentation for the User structure.
// You don't typically instantiate this directly unless adding methods.
// For example, if you needed methods on user objects:
// class User {
//   constructor({ id, email, name, role, ... }) {
//     this.id = id;
//     this.email = email;
//     this.name = name;
//     this.role = role;
//     // ... assign other properties
//   }
//
//   isAdmin() {
//     return this.role === 'admin' || this.role === 'super-admin';
//   }
// }
// export default User;

// Exporting the type definition for potential use with JSDoc elsewhere
export const UserTypeDef = {}; // Placeholder export if needed 