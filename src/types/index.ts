export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string;
  category?: Category;
  unit_price: number;
  image_url: string | null;
  minimum_stock: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  current_stock?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface WarehouseLocation {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  capacity: number;
  current_usage: number;
  location_type: string;
  rotation_method: string;
  notes?: string;
  reserved: boolean;
  created_at: string;
  updated_at: string;
  last_movement?: {
    date: string;
    user: string;
  };
}

export interface Inventory {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  lot_number?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  created_by_user?: {
    email: string;
  };
  updated_by_user?: {
    email: string;
  };
  products?: Product;
  warehouse_locations?: {
    zone: string;
    aisle: string;
    rack: string;
    bin: string;
    capacity: number;
    location_type: string;
    rotation_method: string;
    notes?: string;
  };
}

export type OrderType = 'inbound' | 'outbound';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export type ShippingStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShipmentTracking {
  id: string;
  order_id: string;
  status: ShippingStatus;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  supplier_id: string | null;
  supplier?: Supplier;
  customer_id: string | null;
  customer?: Customer;
  expected_arrival: string | null;
  notes: string | null;
  user_id: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  created_by_user?: {
    email: string;
  };
  updated_by_user?: {
    email: string;
  };
  total_amount?: number;
  shipping_method?: string;
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  shipping_address?: ShippingAddress;
  shipping_cost?: number;
  shipping_status?: ShippingStatus;
  tracking_history?: ShipmentTracking[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_products: number;
  low_stock_items: number;
  pending_orders: number;
  completed_orders_today: number;
  inventory_value: number;
  inventory_by_category: Array<{
    category: string;
    count: number;
  }>;
  recent_activity: Array<{
    id: string;
    timestamp: string;
    action: string;
    details: string;
  }>;
}