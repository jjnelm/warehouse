-- Insert default warehouse locations if they don't exist
INSERT INTO warehouse_locations (
  zone,
  aisle,
  rack,
  bin,
  capacity,
  reserved
) VALUES 
  ('A', '1', '1', '1', 1000, false),
  ('A', '1', '1', '2', 1000, false),
  ('A', '1', '2', '1', 1000, false),
  ('B', '1', '1', '1', 1000, false)
ON CONFLICT (zone, aisle, rack, bin) DO NOTHING; 