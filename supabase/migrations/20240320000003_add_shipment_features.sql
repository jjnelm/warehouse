-- Add shipment-related fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'in_transit', 'delivered', 'failed'));

-- Create shipment_tracking table for detailed tracking history
CREATE TABLE IF NOT EXISTS shipment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add RLS policies for shipment_tracking
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tracking for their orders"
  ON shipment_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipment_tracking.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can view all tracking"
  ON shipment_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update shipping status
CREATE OR REPLACE FUNCTION update_shipping_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the order's shipping_status based on the latest tracking entry
  UPDATE orders
  SET shipping_status = NEW.status
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for shipping status updates
CREATE TRIGGER on_shipment_tracking_update
  AFTER INSERT ON shipment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_status(); 