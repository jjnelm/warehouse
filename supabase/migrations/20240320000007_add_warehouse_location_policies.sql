-- Enable RLS on warehouse_locations table
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON warehouse_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON warehouse_locations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON warehouse_locations;
DROP POLICY IF EXISTS "Enable delete for admin users" ON warehouse_locations;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users"
ON warehouse_locations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON warehouse_locations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON warehouse_locations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for admin users"
ON warehouse_locations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
); 