-- Drop existing policies
DROP POLICY IF EXISTS "All users can view inventory" ON inventory;
DROP POLICY IF EXISTS "Admin and managers can update inventory" ON inventory;

-- Enable RLS on inventory table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory
CREATE POLICY "All users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow inventory updates"
  ON inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Grant necessary permissions
GRANT ALL ON inventory TO authenticated;
GRANT USAGE ON SEQUENCE inventory_id_seq TO authenticated; 