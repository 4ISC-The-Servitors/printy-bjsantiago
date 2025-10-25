import { supabase } from '@lib/supabase';

/**
 * FlowTriggerService - Centralized flow triggering logic
 *
 * This service ensures that the correct chat flow is triggered based on the page context
 * and data state (e.g., quote status, order status, ticket type).
 *
 * It prevents cross-contamination between different pages and provides validation
 * to catch bugs early.
 */

export type AdminPage = 'quotes' | 'tickets' | 'orders';
export type FlowId =
  | 'admin-quote-propose'
  | 'admin-create-order'
  | 'admin-review-ticket'
  | 'admin-issue-ticket'
  | 'admin-track-ticket'
  | 'admin-verify-payment';

interface FlowContext {
  flowId: FlowId;
  context: Record<string, any>;
  sessionTitle: string;
}

export class FlowTriggerService {
  /**
   * Determines which flow to trigger based on page and data
   */
  static async getFlowForContext(
    page: AdminPage,
    entityId: string
  ): Promise<FlowContext | null> {
    switch (page) {
      case 'quotes':
        return this.getQuoteFlow(entityId);
      case 'tickets':
        return this.getTicketFlow(entityId);
      case 'orders':
        return this.getOrderFlow(entityId);
      default:
        console.error(`Unknown page: ${page}`);
        return null;
    }
  }

  /**
   * Quote flow logic: Check status to determine flow
   */
  private static async getQuoteFlow(
    sessionId: string
  ): Promise<FlowContext | null> {

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('status, quote_id, session_id, display_id')
      .eq('session_id', sessionId)
      .single();

    if (quoteError || !quoteData) {
      console.error('⚠️ Could not find quote data:', quoteError);
      return null;
    }


    // ACCEPTED quotes → admin-create-order flow
    if (quoteData.status === 'accepted') {

      // Get the accepted proposal for context
      const { data: proposalData, error: proposalError } = await supabase
        .from('quote_proposals')
        .select('proposal_id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (proposalError) {
        console.error('⚠️ Error fetching accepted proposal:', proposalError);
        return null;
      }

      const context: Record<string, any> = {
        quote_id: quoteData.quote_id,
        session_id: sessionId,
      };

      if (proposalData) {
        context.proposal_id = proposalData.proposal_id;
      } else {
        console.error('⚠️ No accepted proposal found for session:', sessionId);
        return null;
      }

      return {
        flowId: 'admin-create-order',
        context,
        sessionTitle: `Order Creation: ${quoteData.display_id || sessionId}`,
      };
    }

    // NON-ACCEPTED quotes → admin-quote-propose flow

    const { data: savedSpecs } = await supabase
      .from('quote_specs')
      .select('spec_id, spec_data')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    const hasSavedSpecs = savedSpecs && savedSpecs.length > 0;

    if (hasSavedSpecs) {
    } else {
    }

    return {
      flowId: 'admin-quote-propose',
      context: {
        quote_id: quoteData.quote_id,
        session_id: sessionId,
        has_saved_specs: hasSavedSpecs,
        ...(hasSavedSpecs && { saved_spec_id: savedSpecs[0].spec_id }),
      },
      sessionTitle: `Quote Proposal: ${quoteData.display_id || sessionId}`,
    };
  }

  /**
   * Ticket flow logic: Always use admin-review-ticket
   */
  private static async getTicketFlow(
    inquiryId: string
  ): Promise<FlowContext | null> {

    // Fetch ticket data for display ID
    const { data: ticketData } = await supabase
      .from('inquiries_v2')
      .select('display_id')
      .eq('inquiry_id', inquiryId)
      .single();

    return {
      flowId: 'admin-review-ticket',
      context: {
        inquiry_id: inquiryId,
      },
      sessionTitle: `Ticket Review: ${ticketData?.display_id || inquiryId}`,
    };
  }

  /**
   * Order flow logic: Check status to determine flow
   */
  private static async getOrderFlow(
    orderId: string
  ): Promise<FlowContext | null> {

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status, order_id, display_id, customer_id')
      .eq('order_id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('⚠️ Could not find order data:', orderError);
      return null;
    }


    // VERIFYING_PAYMENT status → admin-verify-payment flow
    if (orderData.status === 'verifying_payment') {

      return {
        flowId: 'admin-verify-payment',
        context: {
          order_id: orderData.order_id,
          display_id: orderData.display_id,
          customer_id: orderData.customer_id,
        },
        sessionTitle: `Payment Verification: ${orderData.display_id || orderId}`,
      };
    }

    // For other order statuses, we currently don't have a specific flow
    console.warn(
      '⚠️ No specific flow defined for order status:',
      orderData.status
    );
    return null;
  }

  /**
   * Validates that a flow is appropriate for the given page context
   */
  static validateContext(page: AdminPage, flowId: FlowId): boolean {
    const pageFlows: Record<AdminPage, FlowId[]> = {
      quotes: ['admin-quote-propose', 'admin-create-order'],
      tickets: [
        'admin-review-ticket',
        'admin-issue-ticket',
        'admin-track-ticket',
      ],
      orders: ['admin-verify-payment'],
    };

    const isValid = pageFlows[page]?.includes(flowId) ?? false;

    if (!isValid) {
      console.error(
        `❌ Flow validation failed: "${flowId}" is not valid for page "${page}"`
      );
    }

    return isValid;
  }

  /**
   * Determines whether chat should be reset based on context change
   */
  static shouldResetChat(
    currentPage: AdminPage | null,
    newPage: AdminPage,
    currentEntityId: string | null,
    newEntityId: string,
    hasMessages: boolean
  ): boolean {
    // Always reset if:
    // 1. No messages yet (first open)
    if (!hasMessages) return true;

    // 2. Page changed (e.g., tickets → quotes)
    if (currentPage !== newPage) {
      return true;
    }

    // 3. Entity changed within same page (e.g., different quote)
    if (currentEntityId !== newEntityId) {
      return true;
    }

    // Otherwise, don't reset (e.g., reopening same quote)
    return false;
  }

  /**
   * Checks if a flow should skip typing delays (for admin flows that need instant display)
   */
  static shouldSkipTypingDelay(flowId: FlowId): boolean {
    const instantFlows: FlowId[] = [
      'admin-create-order',
      'admin-verify-payment',
    ];
    return instantFlows.includes(flowId);
  }
}
