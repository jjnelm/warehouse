-- Create function to update inventory when order is completed
CREATE OR REPLACE FUNCTION update_inventory_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  order_item RECORD;
  target_location_id UUID;
  order_items_count INTEGER;
  existing_inventory RECORD;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for order %: type=%, old_status=%, new_status=%', 
    NEW.id, NEW.order_type, OLD.status, NEW.status;

  -- Only process outbound orders
  IF NEW.order_type = 'outbound' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Count order items
    SELECT COUNT(*) INTO order_items_count
    FROM order_items 
    WHERE order_id = NEW.id;

    RAISE NOTICE 'Found % items in order', order_items_count;

    -- Loop through all items in the order
    FOR order_item IN 
      SELECT 
        oi.product_id,
        oi.quantity,
        pli.location_id as assigned_location_id
      FROM order_items oi
      LEFT JOIN pick_lists pl ON pl.order_id = oi.order_id
      LEFT JOIN pick_list_items pli ON pli.pick_list_id = pl.id AND pli.product_id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      RAISE NOTICE 'Processing item: product_id=%, quantity=%, location_id=%', 
        order_item.product_id, order_item.quantity, order_item.assigned_location_id;

      -- Use the location from pick list items if available
      target_location_id := order_item.assigned_location_id;

      -- If no location is assigned, get the first available location
      IF target_location_id IS NULL THEN
        SELECT id INTO target_location_id
        FROM warehouse_locations 
        WHERE reserved = false 
        LIMIT 1;

        IF target_location_id IS NULL THEN
          RAISE EXCEPTION 'No available warehouse location found';
        END IF;
      END IF;

      RAISE NOTICE 'Using warehouse location: %', target_location_id;

      -- Check if product exists in inventory for this location
      SELECT * INTO existing_inventory
      FROM inventory inv
      WHERE inv.product_id = order_item.product_id
      AND inv.location_id = target_location_id
      AND inv.lot_number IS NULL
      LIMIT 1;

      IF existing_inventory IS NOT NULL THEN
        -- Update existing inventory
        UPDATE inventory inv
        SET quantity = inv.quantity - order_item.quantity
        WHERE inv.id = existing_inventory.id;

        RAISE NOTICE 'Updated existing inventory for product % at location %: deducted % units', 
          order_item.product_id, target_location_id, order_item.quantity;
      ELSE
        RAISE EXCEPTION 'No inventory found for product % at location %', 
          order_item.product_id, target_location_id;
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE 'Skipping inventory update: order_type=%, old_status=%, new_status=%', 
      NEW.order_type, OLD.status, NEW.status;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating inventory: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_inventory_on_order_completion ON orders;
CREATE TRIGGER update_inventory_on_order_completion
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_order_completion(); 