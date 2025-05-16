-- Create customer_pricing table
CREATE TABLE IF NOT EXISTS customer_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  special_price DECIMAL(10,2) NOT NULL CHECK (special_price >= 0),
  discount_percentage DECIMAL(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  valid_from DATE NOT NULL,
  valid_to DATE,
  UNIQUE(customer_id, product_id, valid_from)
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
  );

-- Add trigger for updated_at
CREATE TRIGGER update_customer_pricing_updated_at
  BEFORE UPDATE ON customer_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column(); 