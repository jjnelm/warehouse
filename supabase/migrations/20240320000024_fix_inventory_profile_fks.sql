-- Drop existing foreign key constraints if they exist
ALTER TABLE inventory
DROP CONSTRAINT IF EXISTS inventory_created_by_fkey,
DROP CONSTRAINT IF EXISTS inventory_updated_by_fkey;

-- Add foreign key constraints
ALTER TABLE inventory
ADD CONSTRAINT inventory_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

ALTER TABLE inventory
ADD CONSTRAINT inventory_updated_by_fkey
FOREIGN KEY (updated_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add RLS policies for the foreign key relationships
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory created_by and updated_by"
ON inventory
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles
  )
);

CREATE POLICY "Users can update inventory created_by and updated_by"
ON inventory
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles
  )
); 