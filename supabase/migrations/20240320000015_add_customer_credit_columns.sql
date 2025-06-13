-- Drop existing constraints if they exist
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS credit_limit_positive,
DROP CONSTRAINT IF EXISTS current_balance_positive;

-- Add credit limit and current balance columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'credit_limit'
    ) THEN
        ALTER TABLE customers ADD COLUMN credit_limit DECIMAL(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'current_balance'
    ) THEN
        ALTER TABLE customers ADD COLUMN current_balance DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add check constraints
ALTER TABLE customers
ADD CONSTRAINT credit_limit_positive CHECK (credit_limit >= 0),
ADD CONSTRAINT current_balance_positive CHECK (current_balance >= 0);

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "All users can view customers" ON customers;
DROP POLICY IF EXISTS "Admin and managers can update customers" ON customers;

-- Create policies for customers table
CREATE POLICY "All users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to check credit limit before allowing new orders
CREATE OR REPLACE FUNCTION check_customer_credit()
RETURNS TRIGGER AS $$
DECLARE
  customer_credit_limit DECIMAL(10,2);
  customer_balance DECIMAL(10,2);
BEGIN
  -- Only check for outbound orders (sales to customers)
  IF NEW.order_type = 'outbound' THEN
    -- Get customer's credit limit and current balance
    SELECT credit_limit, current_balance 
    INTO customer_credit_limit, customer_balance
    FROM customers 
    WHERE id = NEW.customer_id;

    -- Check if order would exceed credit limit
    IF (customer_balance + NEW.total_amount) > customer_credit_limit THEN
      RAISE EXCEPTION 'Order would exceed customer credit limit. Current balance: %, Credit limit: %, Order amount: %',
        customer_balance, customer_credit_limit, NEW.total_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update current balance when order is shipped
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process outbound orders (sales to customers)
  IF NEW.order_type = 'outbound' THEN
    -- Update balance when order is shipped
    IF NEW.shipping_status = 'in_transit' AND OLD.shipping_status != 'in_transit' THEN
      -- Update customer's current balance
      UPDATE customers
      SET current_balance = current_balance + NEW.total_amount
      WHERE id = NEW.customer_id;
    -- Reduce balance when order is cancelled
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      -- Only reduce balance if the order was previously shipped
      IF OLD.shipping_status = 'in_transit' THEN
        UPDATE customers
        SET current_balance = current_balance - NEW.total_amount
        WHERE id = NEW.customer_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for credit limit check before order creation
DROP TRIGGER IF EXISTS check_customer_credit ON orders;
CREATE TRIGGER check_customer_credit
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_customer_credit();

-- Create trigger for customer balance updates
DROP TRIGGER IF EXISTS update_customer_balance ON orders;
CREATE TRIGGER update_customer_balance
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance(); 