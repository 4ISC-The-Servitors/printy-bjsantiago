import { invokeEdge } from './client';

export interface GetOrderByNumberPayload {
  order_id: string;
}

export interface OrderItemSummary {
  name: string;
  quantity: number;
  price?: number | null;
}

export interface GetOrderByNumberResponse {
  id?: string;
  order_id: string;
  status?: string | null;
  created_at?: string | null;
  total?: number | null;
  order_items?: OrderItemSummary[];
}

export const getOrderByNumber = async (
  payload: GetOrderByNumberPayload
): Promise<GetOrderByNumberResponse | null> => {
  return invokeEdge<GetOrderByNumberResponse | null, GetOrderByNumberPayload>('orders-get-by-number', payload);
};

export interface ListOrdersForCustomerPayload {
  customer_id: string;
  limit?: number;
}

export interface ListOrdersForCustomerResponseItem {
  order_id: string;
  total?: number | null;
  created_at: string;
}

export const listOrdersForCustomer = async (
  payload: ListOrdersForCustomerPayload
): Promise<ListOrdersForCustomerResponseItem[]> => {
  return invokeEdge<ListOrdersForCustomerResponseItem[], ListOrdersForCustomerPayload>('orders-list-for-customer', payload);
};


