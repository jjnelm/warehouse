-- Add quantity_picked and notes columns to pick_list_items table
ALTER TABLE pick_list_items
ADD COLUMN IF NOT EXISTS quantity_picked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update RLS policies to include new columns
ALTER POLICY "Users can view pick list items" ON pick_list_items
    USING (true);

ALTER POLICY "Users can update pick list items" ON pick_list_items
    USING (true)
    WITH CHECK (true);

-- Add trigger to update status based on quantity_picked
CREATE OR REPLACE FUNCTION update_pick_list_item_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity_picked = 0 THEN
        NEW.status := 'pending';
    ELSIF NEW.quantity_picked = NEW.quantity THEN
        NEW.status := 'picked';
    ELSE
        NEW.status := 'partial';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pick_list_item_status_trigger ON pick_list_items;
CREATE TRIGGER update_pick_list_item_status_trigger
    BEFORE UPDATE ON pick_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pick_list_item_status(); 