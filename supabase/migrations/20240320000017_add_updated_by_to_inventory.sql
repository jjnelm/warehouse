-- Drop existing policies
DROP POLICY IF EXISTS "All users can view inventory" ON inventory;
DROP POLICY IF EXISTS "Admin and managers can update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow inventory updates" ON inventory;

-- Add updated_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE inventory ADD COLUMN updated_by UUID REFERENCES profiles(id);
    END IF;
END $$;

-- Update existing records to set updated_by to a default user
-- First, get the first admin user's ID
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

    -- Update NULL updated_by values
    IF default_user_id IS NOT NULL THEN
        UPDATE inventory 
        SET updated_by = default_user_id 
        WHERE updated_by IS NULL;
    END IF;
END $$;

-- Make updated_by NOT NULL after setting default values
ALTER TABLE inventory
ALTER COLUMN updated_by SET NOT NULL;

-- Create trigger function to automatically set updated_by
CREATE OR REPLACE FUNCTION set_inventory_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_inventory_updated_by ON inventory;

-- Create trigger
CREATE TRIGGER set_inventory_updated_by
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_inventory_updated_by();




