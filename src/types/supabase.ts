export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          sku: string
          description: string | null
          category_id: string
          unit_price: number
          image_url: string | null
          minimum_stock: number
          archived: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          sku: string
          description?: string | null
          category_id: string
          unit_price: number
          image_url?: string | null
          minimum_stock?: number
          archived?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          sku?: string
          description?: string | null
          category_id?: string
          unit_price?: number
          image_url?: string | null
          minimum_stock?: number
          archived?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
        }
      }
      warehouse_locations: {
        Row: {
          id: string
          created_at: string
          zone: string
          aisle: string
          rack: string
          bin: string
          capacity: number
          reserved: boolean
          location_type: string
          rotation_method: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          zone: string
          aisle: string
          rack: string
          bin: string
          capacity: number
          reserved?: boolean
          location_type?: string
          rotation_method?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          zone?: string
          aisle?: string
          rack?: string
          bin?: string
          capacity?: number
          reserved?: boolean
          location_type?: string
          rotation_method?: string
          notes?: string | null
        }
      }
      inventory: {
        Row: {
          id: string
          created_at: string
          product_id: string
          location_id: string
          quantity: number
          lot_number: string | null
          expiry_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          location_id: string
          quantity: number
          lot_number?: string | null
          expiry_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          location_id?: string
          quantity?: number
          lot_number?: string | null
          expiry_date?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_number: string
          order_type: 'inbound' | 'outbound'
          status: 'pending' | 'processing' | 'completed' | 'cancelled'
          supplier_id: string | null
          customer_id: string | null
          expected_arrival: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_number: string
          order_type: 'inbound' | 'outbound'
          status?: 'pending' | 'processing' | 'completed' | 'cancelled'
          supplier_id?: string | null
          customer_id?: string | null
          expected_arrival?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_number?: string
          order_type?: 'inbound' | 'outbound'
          status?: 'pending' | 'processing' | 'completed' | 'cancelled'
          supplier_id?: string | null
          customer_id?: string | null
          expected_arrival?: string | null
          notes?: string | null
          user_id?: string
        }
      }
      order_items: {
        Row: {
          id: string
          created_at: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
      }
      suppliers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          role: 'admin' | 'manager' | 'staff'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          role?: 'admin' | 'manager' | 'staff'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          role?: 'admin' | 'manager' | 'staff'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}