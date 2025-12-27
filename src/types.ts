export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'pix' | 'none';

export interface Group {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  group: string; // ID do Group
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  group: string; // ID do Group
  category: string; // ID da Category
  active: boolean;
  image_url?: string;
  images?: string[]; 
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  payment_method: PaymentMethod;
  received_amount: number;
  change_amount: number;
  is_paid: boolean;
  created: string;
  updated: string;
}