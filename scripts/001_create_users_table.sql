-- Create the users table only if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.users (
    -- Use UUID for the primary key, automatically generated
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User identification and credentials
    email text, -- Ensure valid email format
    password text NOT NULL, -- Store the hashed password

    -- User profile information
    name text,
    role text NOT NULL DEFAULT 'user', -- Set a default role, e.g., 'user'
    phone text NOT NULL, -- Storing as text accommodates international formats and symbols like '+'

    -- Status and Timestamps
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL, -- Timestamp with time zone for creation
    updated_at timestamptz DEFAULT now() NOT NULL, -- Timestamp with time zone for last update
    deleted_at timestamptz DEFAULT NULL, -- Timestamp for soft deletion (nullable)

    -- Additional data
    fcm_tokens text[] -- Array of text for storing FCM tokens
);


-- Add indexes for frequently queried columns to improve performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users (is_active);

