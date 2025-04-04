import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

/**
 * Gets a Supabase client instance initialized with credentials from the environment.
 * Caches the instance for reuse within the same worker execution context.
 * @param {object} env - The environment object passed to the fetch handler.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} If Supabase URL or Key are missing in the environment.
 */
export function getSupabaseClient(env) {
    if (supabaseInstance) {
        // Reusing the existing instance for this worker isolate
        return supabaseInstance;
    }

    // Accessing variables and secrets from the env object provided by the Worker runtime
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing from environment variables.");
        // Throw an error to clearly indicate a configuration problem
        throw new Error("Missing Supabase credentials in worker environment");
    }

    // Create the Supabase client instance using the retrieved credentials
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
             persistSession: false // Important for serverless environments
        }
    });

    return supabaseInstance;
} 