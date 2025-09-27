import { supabase } from '../lib/supabase';

export type OrderData = {
  order_id: string; // varchar
  service_id: string; // varchar
  customer_id: string; // uuid
  order_status: string; // varchar
  delivery_mode: string; // varchar
  order_date_time: string; // timestamp (ISO string)
  completed_date_time: string | null; // timestamp (ISO string or null)
  specification: string; // varchar
  page_size: string; // varchar
  quantity: number; // numeric
  priority_level: number; // numeric
};

export async function createOrder(order: OrderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        order_id: order.order_id,
        service_id: order.service_id,
        customer_id: order.customer_id,
        order_status: order.order_status,
        delivery_mode: order.delivery_mode,
        order_datetime: order.order_date_time,
        completed_datetime: order.completed_date_time,
        specification: order.specification,
        page_size: order.page_size,
        quantity: order.quantity,
        priority_level: order.priority_level,
      },
    ])
    .select()
    .single();
  if (error) {
    console.error('Order creation failed:', error);
    return { success: false, error };
  }
  return { success: true, data };
}
