-- Drop existing policies and triggers
DROP POLICY IF EXISTS "All users can view customer pricing" ON customer_pricing;
DROP POLICY IF EXISTS "Admin and managers can manage customer pricing" ON customer_pricing;
DROP TRIGGER IF EXISTS update_customer_pricing_updated_at ON customer_pricing;

-- Create customer pricing table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(customer_id, product_id)
);

-- Enable RLS
ALTER TABLE customer_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All users can view customer pricing"
  ON customer_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can manage customer pricing"
  ON customer_pricing FOR ALL
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

-- Add trigger for updated_at
CREATE TRIGGER update_customer_pricing_updated_at
  BEFORE UPDATE ON customer_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column(); 