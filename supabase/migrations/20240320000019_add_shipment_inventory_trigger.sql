-- Create function to update inventory when shipment is completed
CREATE OR REPLACE FUNCTION update_inventory_on_shipment_completion()
RETURNS TRIGGER AS $$
DECLARE
  pick_list_item RECORD;
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

    -- Get the pick list for this order
    FOR pick_list_item IN 
      SELECT pli.*, pl.id as pick_list_id
      FROM pick_list_items pli
      JOIN pick_lists pl ON pl.id = pli.pick_list_id
      WHERE pl.order_id = NEW.id
      AND pli.status = 'completed'
    LOOP
      -- Deduct inventory from the specific location
      UPDATE inventory
      SET quantity = quantity - pick_list_item.quantity
      WHERE id = pick_list_item.inventory_id;

      RAISE NOTICE 'Deducted % units from inventory % at location %', 
        pick_list_item.quantity, pick_list_item.inventory_id, pick_list_item.location_id;
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