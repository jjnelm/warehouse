-- Create function to create pick list from order
CREATE OR REPLACE FUNCTION create_pick_list_from_order()
RETURNS TRIGGER AS $$
DECLARE
    pick_list_id UUID;
    order_item RECORD;
    available_locations RECORD;
    remaining_quantity INTEGER;
    pick_quantity INTEGER;
BEGIN
    -- Only create pick list for outbound orders
    IF NEW.order_type = 'outbound' AND NEW.status = 'processing' THEN
        -- Create pick list
        INSERT INTO pick_lists (
            order_id,
            status,
            created_by
        ) VALUES (
            NEW.id,
            'pending',
            NEW.user_id
        ) RETURNING id INTO pick_list_id;

        -- Create pick list items from order items
        FOR order_item IN 
            SELECT oi.*, p.id as product_id
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = NEW.id
        LOOP
            remaining_quantity := order_item.quantity;
            
            -- Get available locations for this product ordered by quantity
            FOR available_locations IN 
                SELECT i.id as inventory_id, i.quantity, i.location_id
                FROM inventory i
                WHERE i.product_id = order_item.product_id
                AND i.quantity > 0
                ORDER BY i.quantity DESC
            LOOP
                IF remaining_quantity <= 0 THEN
                    EXIT;
                END IF;

                pick_quantity := LEAST(remaining_quantity, available_locations.quantity);
                
                -- Create pick list item for this location
                INSERT INTO pick_list_items (
                    pick_list_id,
                    product_id,
                    quantity,
                    status,
                    inventory_id,
                    location_id
                ) VALUES (
                    pick_list_id,
                    order_item.product_id,
                    pick_quantity,
                    'pending',
                    available_locations.inventory_id,
                    available_locations.location_id
                );

                remaining_quantity := remaining_quantity - pick_quantity;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS create_pick_list_trigger ON orders;
CREATE TRIGGER create_pick_list_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_pick_list_from_order();

-- Create pick lists for existing outbound orders
DO $$
DECLARE
    order_record RECORD;
BEGIN
    FOR order_record IN 
        SELECT o.* 
        FROM orders o 
        WHERE o.order_type = 'outbound' 
        AND o.status = 'processing'
        AND NOT EXISTS (
            SELECT 1 
            FROM pick_lists pl 
            WHERE pl.order_id = o.id
        )
    LOOP
        -- Create pick list
        INSERT INTO pick_lists (
            order_id,
            status,
            created_by
        ) VALUES (
            order_record.id,
            'pending',
            order_record.user_id
        );

        -- Create pick list items
        INSERT INTO pick_list_items (
            pick_list_id,
            product_id,
            quantity,
            status,
            inventory_id,
            location_id
        )
        SELECT 
            pl.id,
            oi.product_id,
            oi.quantity,
            'pending',
            i.id as inventory_id,
            i.location_id
        FROM order_items oi
        CROSS JOIN LATERAL (
            SELECT id 
            FROM pick_lists 
            WHERE order_id = order_record.id
        ) pl
        JOIN inventory i ON i.product_id = oi.product_id
        WHERE oi.order_id = order_record.id
        AND i.quantity > 0
        ORDER BY i.quantity DESC;
    END LOOP;
END $$; 