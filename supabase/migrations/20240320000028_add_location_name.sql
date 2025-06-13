-- Drop the name column if it exists
ALTER TABLE warehouse_locations
DROP COLUMN IF EXISTS name;

-- Add name column as a generated column
ALTER TABLE warehouse_locations
ADD COLUMN name TEXT GENERATED ALWAYS AS (zone || '-' || aisle || '-' || rack || '-' || bin) STORED; 