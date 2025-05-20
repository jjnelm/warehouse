-- Create function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'TRK';
    timestamp_part TEXT;
    random_part TEXT;
    tracking_number TEXT;
BEGIN
    -- Get current timestamp in format YYMMDDHHMMSS
    timestamp_part := to_char(now(), 'YYMMDDHH24MISS');
    
    -- Generate 4 random alphanumeric characters
    random_part := substr(md5(random()::text), 1, 4);
    
    -- Combine parts: TRK-YYMMDDHHMMSS-XXXX
    tracking_number := prefix || '-' || timestamp_part || '-' || random_part;
    
    RETURN tracking_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to set tracking number on insert
CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set tracking number if it's not already set
    IF NEW.tracking_number IS NULL THEN
        NEW.tracking_number := generate_tracking_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both orders and shipments tables
DROP TRIGGER IF EXISTS set_order_tracking_number ON orders;
CREATE TRIGGER set_order_tracking_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_tracking_number();

-- Add the same functionality to shipments if you have a shipments table
-- DROP TRIGGER IF EXISTS set_shipment_tracking_number ON shipments;
-- CREATE TRIGGER set_shipment_tracking_number
--     BEFORE INSERT ON shipments
--     FOR EACH ROW
--     EXECUTE FUNCTION set_tracking_number(); 