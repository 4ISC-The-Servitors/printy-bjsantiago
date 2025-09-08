import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OrderData = {
  service_id: string;
  customer_id: string;
  order_status: string;
  delivery_mode: string;
  order_date_time: string;
  completed_date_time: string | null;
  page_size: string;
  quantity: number;
  priority_level: string;
};

export async function createOrder(order: OrderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([order]);
  if (error) {
    console.error('Order creation failed:', error);
    return { success: false, error };
  }
  return { success: true, data };
}