/** `open` re-opens a day that is normally closed (e.g. a Monday for a wedding). */
export type DayStatus = 'limited' | 'booked' | 'closed' | 'open';

export interface DayOverride {
  day: string;
  status: DayStatus;
  note?: string | null;
}

export type OrderStatus = 'received' | 'confirmed' | 'baking' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface OrderItemRecord {
  product_slug: string;
  product_name: string;
  size_label: string;
  flavor: string | null;
  decoration: string | null;
  message: string | null;
  notes: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'card' | 'in_person';
  customer_name: string;
  email: string;
  phone: string;
  fulfillment: 'pickup' | 'delivery';
  address: { line1: string; line2?: string; city: string; postal: string } | null;
  fulfillment_date: string;
  time_slot: string;
  instructions: string | null;
  admin_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  order_items: OrderItemRecord[];
}

export type RequestStatus = 'new' | 'quoted' | 'confirmed' | 'declined';

export interface CustomRequestRecord {
  id: string;
  size: string;
  flavor: string;
  filling: string;
  frosting: string;
  decoration_style: string;
  inspiration_paths: string[];
  event_date: string;
  occasion: string | null;
  instructions: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: RequestStatus;
  quote_amount: number | null;
  admin_notes: string | null;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  created_at: string;
}

export interface SubscriberRecord {
  email: string;
  created_at: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface ReviewRecord {
  id: string;
  order_id: string;
  name: string;
  rating: number;
  comment: string;
  products: string[];
  lang: 'en' | 'es';
  status: ReviewStatus;
  created_at: string;
  /** Joined from the order, for the admin only. */
  orders?: { order_number: string; customer_name: string; email: string } | null;
}
