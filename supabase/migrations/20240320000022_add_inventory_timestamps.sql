-- Add timestamp columns to inventory table if they don't exist
DO $$ 
BEGIN
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE inventory ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE inventory ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$; 