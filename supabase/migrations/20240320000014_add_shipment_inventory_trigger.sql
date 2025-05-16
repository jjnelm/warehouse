-- Create function to update inventory when shipment is completed
CREATE OR REPLACE FUNCTION update_inventory_on_shipment_completion()
RETURNS TRIGGER AS $$
DECLARE
  order_item RECORD;
  total_available_stock INTEGER;
  remaining_quantity INTEGER;
  inventory_record RECORD;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for order %: type=%, old_status=%, new_status=%', 
    NEW.id, NEW.order_type, OLD.status, NEW.status;

  -- Only process outbound orders (shipments)
  IF NEW.order_type = 'outbound' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update customer's current balance
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET current_balance = current_balance + NEW.total_amount
      WHERE id = NEW.customer_id;
    END IF;

    -- Loop through all items in the order
    FOR order_item IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      RAISE NOTICE 'Processing item: product_id=%, quantity=%', 
        order_item.product_id, order_item.quantity;

      -- Get total available stock across all locations
      SELECT COALESCE(SUM(quantity), 0) INTO total_available_stock
      FROM inventory 
      WHERE product_id = order_item.product_id;

      IF total_available_stock = 0 THEN
        RAISE EXCEPTION 'No inventory found for product %', order_item.product_id;
      END IF;

      -- Check if we have enough total stock
      IF total_available_stock < order_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', 
          order_item.product_id, total_available_stock, order_item.quantity;
      END IF;

      -- Deduct from inventory locations, starting with the one with highest quantity
      remaining_quantity := order_item.quantity;
      
      FOR inventory_record IN 
        SELECT id, quantity 
        FROM inventory 
        WHERE product_id = order_item.product_id 
        ORDER BY quantity DESC
      LOOP
        IF remaining_quantity <= 0 THEN
          EXIT;
        END IF;

        IF inventory_record.quantity >= remaining_quantity THEN
          -- This location has enough stock
          UPDATE inventory
          SET quantity = quantity - remaining_quantity
          WHERE id = inventory_record.id;
          remaining_quantity := 0;
        ELSE
          -- Use all stock from this location
          UPDATE inventory
          SET quantity = 0
          WHERE id = inventory_record.id;
          remaining_quantity := remaining_quantity - inventory_record.quantity;
        END IF;
      END LOOP;
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
DROP TRIGGER IF EXISTS update_inventory_on_shipment_completion ON orders;
CREATE TRIGGER update_inventory_on_shipment_completion
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_shipment_completion(); 