-- Create function to update inventory when order is completed
CREATE OR REPLACE FUNCTION update_inventory_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  order_item RECORD;
  default_location_id UUID;
  order_items_count INTEGER;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for order %: type=%, old_status=%, new_status=%', 
    NEW.id, NEW.order_type, OLD.status, NEW.status;

  -- Only process inbound orders
  IF NEW.order_type = 'inbound' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get default location (first available location)
    SELECT id INTO default_location_id 
    FROM warehouse_locations 
    WHERE reserved = false 
    LIMIT 1;

    IF default_location_id IS NULL THEN
      RAISE EXCEPTION 'No available warehouse location found';
    END IF;

    RAISE NOTICE 'Using warehouse location: %', default_location_id;

    -- Count order items
    SELECT COUNT(*) INTO order_items_count
    FROM order_items 
    WHERE order_id = NEW.id;

    RAISE NOTICE 'Found % items in order', order_items_count;

    -- Loop through all items in the order
    FOR order_item IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      RAISE NOTICE 'Processing item: product_id=%, quantity=%', 
        order_item.product_id, order_item.quantity;

      -- Check if product exists in inventory for this location
      IF EXISTS (
        SELECT 1 FROM inventory 
        WHERE product_id = order_item.product_id
        AND location_id = default_location_id
      ) THEN
        -- Update existing inventory
        UPDATE inventory
        SET quantity = quantity + order_item.quantity
        WHERE product_id = order_item.product_id
        AND location_id = default_location_id;

        RAISE NOTICE 'Updated existing inventory for product % at location %: added % units', 
          order_item.product_id, default_location_id, order_item.quantity;
      ELSE
        -- Insert new inventory record
        INSERT INTO inventory (
          product_id,
          location_id,
          quantity
        ) VALUES (
          order_item.product_id,
          default_location_id,
          order_item.quantity
        );

        RAISE NOTICE 'Created new inventory record for product % at location %: % units', 
          order_item.product_id, default_location_id, order_item.quantity;
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