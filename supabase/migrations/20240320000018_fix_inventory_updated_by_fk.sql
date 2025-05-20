-- Drop existing foreign key constraint if it exists
ALTER TABLE inventory
DROP CONSTRAINT IF EXISTS inventory_updated_by_fkey;

-- Add foreign key constraint
ALTER TABLE inventory
ADD CONSTRAINT inventory_updated_by_fkey
FOREIGN KEY (updated_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Update the trigger to handle NULL cases
CREATE OR REPLACE FUNCTION set_inventory_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_inventory_updated_by ON inventory;
CREATE TRIGGER set_inventory_updated_by
  BEFORE INSERT OR UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION set_inventory_updated_by(); 