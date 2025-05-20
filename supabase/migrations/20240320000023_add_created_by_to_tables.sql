-- Add created_by column to inventory table
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Update existing records to set created_by to a default user
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    SELECT id INTO default_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;

    -- If no admin user found, get any user
    IF default_user_id IS NULL THEN
        SELECT id INTO default_user_id 
        FROM profiles 
        LIMIT 1;
    END IF;

    -- Update NULL created_by values
    IF default_user_id IS NOT NULL THEN
        UPDATE inventory 
        SET created_by = default_user_id 
        WHERE created_by IS NULL;
    END IF;
END $$;

-- Make created_by NOT NULL after setting default values
ALTER TABLE inventory
ALTER COLUMN created_by SET NOT NULL;

-- Create trigger function to automatically set created_by
CREATE OR REPLACE FUNCTION set_inventory_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for created_by
DROP TRIGGER IF EXISTS set_inventory_created_by ON inventory;
CREATE TRIGGER set_inventory_created_by
    BEFORE INSERT ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_inventory_created_by();

-- Add created_by and updated_by columns to orders table as nullable
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- First, ensure all records have a user_id or default user
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Get an admin user or any user as fallback
    SELECT id INTO default_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;

    IF default_user_id IS NULL THEN
        SELECT id INTO default_user_id 
        FROM profiles 
        LIMIT 1;
    END IF;

    -- Update all records to ensure they have a valid user_id
    IF default_user_id IS NOT NULL THEN
        -- Update records where user_id is NULL
        UPDATE orders 
        SET user_id = default_user_id 
        WHERE user_id IS NULL;

        -- Now update created_by and updated_by
        UPDATE orders 
        SET 
            created_by = user_id,
            updated_by = user_id
        WHERE created_by IS NULL OR updated_by IS NULL;
    END IF;
END $$;

-- Now that all records have values, set the columns to NOT NULL
ALTER TABLE orders
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN updated_by SET NOT NULL;

-- Create trigger function to automatically set created_by
CREATE OR REPLACE FUNCTION set_orders_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for created_by
DROP TRIGGER IF EXISTS set_orders_created_by ON orders;
CREATE TRIGGER set_orders_created_by
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_orders_created_by();

-- Create trigger function to automatically set updated_by
CREATE OR REPLACE FUNCTION set_orders_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_by
DROP TRIGGER IF EXISTS set_orders_updated_by ON orders;
CREATE TRIGGER set_orders_updated_by
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_orders_updated_by(); 