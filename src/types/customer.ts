export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  credit_limit?: number;
  current_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrder {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  order_number: string;
  order_type: 'inbound' | 'outbound';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  shipping_method?: string;
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  shipping_cost?: number;
  shipping_status?: 'pending' | 'in_transit' | 'delivered' | 'failed';
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CustomerPricing {
  id: string;
  customer_id: string;
  product_id: string;
  special_price: number;
  discount_percentage?: number;
  valid_from: string;
  valid_to?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationLog {
  id: string;
  customer_id: string;
  type: 'email' | 'phone' | 'meeting' | 'other';
  subject: string;
  content: string;
  date: string;
  follow_up_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface CustomerAnalytics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  orderFrequency: number; // orders per month
  paymentHistory: {
    onTime: number;
    late: number;
    outstanding: number;
  };
} 