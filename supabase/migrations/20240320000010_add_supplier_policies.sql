-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable delete for admin users" ON suppliers;

-- Enable RLS on suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create a single policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON suppliers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true); 