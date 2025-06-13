-- Create pick_lists table
CREATE TABLE IF NOT EXISTS pick_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    pick_list_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    notes TEXT
);

-- Create pick_list_items table
CREATE TABLE IF NOT EXISTS pick_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    pick_list_id UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'completed')),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    location_id UUID NOT NULL REFERENCES warehouse_locations(id),
    picked_quantity INTEGER DEFAULT 0,
    picked_at TIMESTAMPTZ,
    picked_by UUID REFERENCES profiles(id),
    notes TEXT
);

-- Create function to generate pick list number
CREATE OR REPLACE FUNCTION generate_pick_list_number()
RETURNS TRIGGER AS $$
DECLARE
    date_str TEXT;
    random_num TEXT;
BEGIN
    date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
    random_num := lpad(floor(random() * 10000)::text, 4, '0');
    NEW.pick_list_number := 'PL-' || date_str || '-' || random_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_pick_list_number ON pick_lists;

-- Create trigger to set pick list number
CREATE TRIGGER set_pick_list_number
    BEFORE INSERT ON pick_lists
    FOR EACH ROW
    EXECUTE FUNCTION generate_pick_list_number();

-- Create function to create pick list from order
CREATE OR REPLACE FUNCTION create_pick_list_from_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create pick list for outbound orders that are being processed
    IF NEW.order_type = 'outbound' AND NEW.status = 'processing' AND OLD.status != 'processing' THEN
        -- Create pick list
        INSERT INTO pick_lists (order_id, created_by)
        VALUES (NEW.id, auth.uid());
        
        -- Create pick list items from order items
        INSERT INTO pick_list_items (pick_list_id, product_id, quantity)
        SELECT 
            pl.id,
            oi.product_id,
            oi.quantity
        FROM order_items oi
        CROSS JOIN LATERAL (
            SELECT id FROM pick_lists WHERE order_id = NEW.id ORDER BY created_at DESC LIMIT 1
        ) pl
        WHERE oi.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create pick list after order update
CREATE TRIGGER create_pick_list
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_pick_list_from_order();

-- Add RLS policies
ALTER TABLE pick_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_list_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all pick lists" ON pick_lists;
DROP POLICY IF EXISTS "Users can create pick lists" ON pick_lists;
DROP POLICY IF EXISTS "Users can update their assigned pick lists" ON pick_lists;
DROP POLICY IF EXISTS "Users can view all pick list items" ON pick_list_items;
DROP POLICY IF EXISTS "Users can create pick list items" ON pick_list_items;
DROP POLICY IF EXISTS "Users can update pick list items" ON pick_list_items;

-- Policies for pick_lists
CREATE POLICY "Users can view all pick lists"
    ON pick_lists FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create pick lists"
    ON pick_lists FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their assigned pick lists"
    ON pick_lists FOR UPDATE
    TO authenticated
    USING (assigned_to = auth.uid() OR created_by = auth.uid())
    WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

-- Policies for pick_list_items
CREATE POLICY "Users can view all pick list items"
    ON pick_list_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create pick list items"
    ON pick_list_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update pick list items"
    ON pick_list_items FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM pick_lists pl
        WHERE pl.id = pick_list_items.pick_list_id
        AND (pl.assigned_to = auth.uid() OR pl.created_by = auth.uid())
    )); 