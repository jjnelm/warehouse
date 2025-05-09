-- Insert default categories if they don't exist
INSERT INTO categories (id, name, description)
VALUES 
  ('9e91e1fc-c883-4634-b3a5-1f8b182309ed', 'Electronics', 'Electronic devices and components')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description)
VALUES 
  ('f2c38d31-4a4c-4b84-8d40-4da154bc71e4', 'Office Supplies', 'Office and stationery items')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description)
VALUES 
  ('3a0a8831-3a7f-42f6-bb3c-5e5eb4dbc8f9', 'Furniture', 'Office furniture and fixtures')
ON CONFLICT (id) DO NOTHING; 