-- First, let's check if we have any users in the profiles table
DO $$
DECLARE
    user_count INTEGER;
    default_user_id UUID;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- If no users exist, create a default admin user
    IF user_count = 0 THEN
        INSERT INTO profiles (id, email, role)
        VALUES (
            gen_random_uuid(),
            'admin@example.com',
            'admin'
        )
        RETURNING id INTO default_user_id;
    ELSE
        -- Get an admin user or any user
        SELECT id INTO default_user_id 
        FROM profiles 
        WHERE role = 'admin' 
        LIMIT 1;

        IF default_user_id IS NULL THEN
            SELECT id INTO default_user_id 
            FROM profiles 
            LIMIT 1;
        END IF;
    END IF;

    -- Now update any NULL user_id values
    IF default_user_id IS NOT NULL THEN
        UPDATE orders 
        SET user_id = default_user_id 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Now let's check if we have any NULL values in created_by or updated_by
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Get an admin user or any user
    SELECT id INTO default_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;

    IF default_user_id IS NULL THEN
        SELECT id INTO default_user_id 
        FROM profiles 
        LIMIT 1;
    END IF;

    -- Update any NULL values in created_by or updated_by
    IF default_user_id IS NOT NULL THEN
        UPDATE orders 
        SET 
            created_by = COALESCE(created_by, user_id, default_user_id),
            updated_by = COALESCE(updated_by, user_id, default_user_id)
        WHERE created_by IS NULL OR updated_by IS NULL;
    END IF;
END $$; 