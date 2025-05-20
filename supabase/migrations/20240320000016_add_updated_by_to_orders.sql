-- Add updated_by column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- Update existing orders to set updated_by to user_id
UPDATE orders
SET updated_by = user_id
WHERE updated_by IS NULL;

-- Make updated_by NOT NULL after setting default values
ALTER TABLE orders
ALTER COLUMN updated_by SET NOT NULL;

-- Create trigger to automatically set updated_by
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_by
DROP TRIGGER IF EXISTS set_orders_updated_by ON orders;
CREATE TRIGGER set_orders_updated_by
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by(); 