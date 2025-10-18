/**
 * Shared helper functions for fetching and formatting order details
 *
 * This module consolidates order-related data fetching and formatting logic,
 * improving code maintainability and consistency across admin order actions.
 *
 * Performance Note: These helpers optimize data fetching by reducing redundant queries
 * through proper data structure and field selection.
 */

import { supabase } from '@lib/supabase';

export interface OrderDetailsData {
  orderId: string;
  displayId: string | null;
  customerId: string;
  orderSpecs: any;
  totalAmount: number;
  status: string;
  paymentProof: string | null;
  paymentVerifiedAt: string | null;
  paymentVerifiedBy: string | null;
  paymentDeniedAt: string | null;
  paymentDeniedBy: string | null;
  createdAt: string;
  updatedAt: string;
  quoteId: string | null;
  proposalId: string | null;
  sessionId: string | null;
}

/**
 * Fetch complete order details by order ID
 */
export async function fetchOrderDetails(
  orderId: string
): Promise<OrderDetailsData | null> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        order_id,
        display_id,
        customer_id,
        order_specs,
        total_amount,
        status,
        payment_proof,
        payment_verified_at,
        payment_verified_by,
        payment_denied_at,
        payment_denied_by,
        created_at,
        updated_at,
        quote_id,
        proposal_id,
        session_id
      `)
      .eq('order_id', orderId)
      .single();

    if (error || !order) {
      console.error('[fetchOrderDetails] Error fetching order:', error);
      return null;
    }

    return {
      orderId: order.order_id,
      displayId: order.display_id,
      customerId: order.customer_id,
      orderSpecs: order.order_specs || {},
      totalAmount: order.total_amount,
      status: order.status,
      paymentProof: order.payment_proof,
      paymentVerifiedAt: order.payment_verified_at,
      paymentVerifiedBy: order.payment_verified_by,
      paymentDeniedAt: order.payment_denied_at,
      paymentDeniedBy: order.payment_denied_by,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      quoteId: order.quote_id,
      proposalId: order.proposal_id,
      sessionId: order.session_id,
    };
  } catch (error) {
    console.error('[fetchOrderDetails] Unexpected error:', error);
    return null;
  }
}

/**
 * Format order specifications into a readable text format
 * Similar to formatProposalSpecs but for order data
 */
export function formatOrderSpecs(
  orderSpecs: any,
  adminNotes?: string
): string[] {
  const lines: string[] = [];

  if (orderSpecs.product_name) {
    lines.push(`• Product: ${orderSpecs.product_name}`);
  }

  if (orderSpecs.category) {
    lines.push(`• Category: ${orderSpecs.category}`);
  }

  if (orderSpecs.description) {
    lines.push(`• Description: ${orderSpecs.description}`);
  }

  if (orderSpecs.size) {
    lines.push(`• Size: ${orderSpecs.size}`);
  }

  if (Array.isArray(orderSpecs.materials) && orderSpecs.materials.length > 0) {
    lines.push(`• Materials: ${orderSpecs.materials.join(', ')}`);
  }

  if (orderSpecs.color) {
    lines.push(`• Color: ${orderSpecs.color}`);
  }

  if (Array.isArray(orderSpecs.finishing) && orderSpecs.finishing.length > 0) {
    lines.push(`• Finishing: ${orderSpecs.finishing.join(', ')}`);
  }

  if (orderSpecs.quantity) {
    lines.push(`• Quantity: ${orderSpecs.quantity}`);
  }

  if (orderSpecs.deadline) {
    lines.push(`• Deadline: ${orderSpecs.deadline}`);
  }

  if (orderSpecs.notes) {
    lines.push(`• Notes: ${orderSpecs.notes}`);
  }

  if (adminNotes) {
    lines.push(`• Admin Notes: ${adminNotes}`);
  }

  return lines;
}

/**
 * Format complete order details for admin view
 */
export function formatOrderDetailsForAdmin(
  orderDetails: OrderDetailsData
): string {
  const specLines = formatOrderSpecs(orderDetails.orderSpecs);
  
  let text = `Order Details:\n`;
  text += `Order ID: ${orderDetails.displayId || orderDetails.orderId}\n`;
  text += `Status: ${orderDetails.status}\n`;
  text += `Created: ${new Date(orderDetails.createdAt).toLocaleDateString()}\n\n`;
  
  if (specLines.length > 0) {
    text += `Specifications:\n`;
    text += specLines.join('\n');
    text += `\n\n`;
  }

  text += `Total Amount: ₱${Number(orderDetails.totalAmount).toLocaleString()}`;

  return text;
}
