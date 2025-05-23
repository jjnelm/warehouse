-- Add location metadata columns to warehouse_locations table
ALTER TABLE warehouse_locations
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS rotation_method TEXT DEFAULT 'FIFO',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to set default values
UPDATE warehouse_locations
SET 
  location_type = 'Standard',
  rotation_method = 'FIFO'
WHERE location_type IS NULL OR rotation_method IS NULL; 