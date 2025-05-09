-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tracking for their orders" ON shipment_tracking;
DROP POLICY IF EXISTS "Admin users can view all tracking" ON shipment_tracking;
DROP POLICY IF EXISTS "Users can insert tracking for their orders" ON shipment_tracking;
DROP POLICY IF EXISTS "Users can update tracking for their orders" ON shipment_tracking;

-- Enable RLS on shipment_tracking table
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for shipment_tracking table
CREATE POLICY "Users can view tracking for their orders"
  ON shipment_tracking
  FOR SELECT
  TO authenticated
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
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert tracking for their orders"
  ON shipment_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipment_tracking.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tracking for their orders"
  ON shipment_tracking
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipment_tracking.order_id
      AND orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipment_tracking.order_id
      AND orders.user_id = auth.uid()
    )
  ); 