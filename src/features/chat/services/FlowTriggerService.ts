import { supabase } from '@lib/supabase';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

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

export type AdminFlowId =
  | 'admin-quote-propose'
  | 'admin-create-order'
  | 'admin-review-ticket'
  | 'admin-issue-ticket'
  | 'admin-track-ticket'
  | 'admin-verify-payment'
  | 'admin-verify-payment-valued'
  | 'admin-change-order-status'
  | 'admin-add-service'
  | 'admin-update-service';

export type CustomerFlowId =
  | 'track-quote'
  | 'track-ticket'
  | 'pay-order'
  | 'reupload-payment';

export type FlowId = AdminFlowId | CustomerFlowId;

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
   * Get flow context for admin flows that don't require an entity ID
   * (e.g., admin-add-service)
   */
  static async getAdminFlowContext(
    flowId: AdminFlowId
  ): Promise<FlowContext | null> {
    switch (flowId) {
      case 'admin-add-service':
        return this.getAddServiceFlow();
      default:
        console.error(`Unknown admin flow: ${flowId}`);
        return null;
    }
  }

  /**
   * Get flow context for admin flows that require a service_id
   * (e.g., admin-update-service)
   */
  static async getAdminServiceFlowContext(
    flowId: AdminFlowId,
    serviceId: string
  ): Promise<FlowContext | null> {
    switch (flowId) {
      case 'admin-update-service':
        return this.getUpdateServiceFlow(serviceId);
      default:
        console.error(`Unknown admin service flow: ${flowId}`);
        return null;
    }
  }

  /**
   * Admin add-service flow - no entity ID required
   */
  private static async getAddServiceFlow(): Promise<FlowContext | null> {
    return {
      flowId: 'admin-add-service',
      context: {},
      sessionTitle: getSessionTitle({
        flowId: 'admin-add-service',
        metadata: {
          context: {},
        },
      }),
    };
  }

  /**
   * Admin update-service flow - requires service_id
   */
  private static async getUpdateServiceFlow(
    serviceId: string
  ): Promise<FlowContext | null> {
    // Fetch service data to get display_id for session title
    const { data: serviceData } = await supabase
      .from('printing_services')
      .select('service_id, display_id, service_name')
      .eq('service_id', serviceId)
      .single();

    if (!serviceData) {
      console.error('Could not find service data for:', serviceId);
      return null;
    }

    return {
      flowId: 'admin-update-service',
      context: {
        service_id: serviceId,
      },
      sessionTitle: getSessionTitle({
        flowId: 'admin-update-service',
        metadata: {
          context: {
            display_id: serviceData.display_id,
            service_name: serviceData.service_name,
          },
        },
      }),
    };
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
        sessionTitle: getSessionTitle({
          flowId: 'admin-create-order',
          metadata: {
            context: {
              display_id: quoteData.display_id,
            },
          },
          quote: { display_id: quoteData.display_id },
        }),
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
      sessionTitle: getSessionTitle({
        flowId: 'admin-quote-propose',
        metadata: {
          context: {
            display_id: quoteData.display_id,
          },
        },
        quote: { display_id: quoteData.display_id },
      }),
    };
  }

  /**
   * Ticket flow logic: Always use admin-review-ticket
   */
  private static async getTicketFlow(
    inquiryId: string
  ): Promise<FlowContext | null> {
    // Fetch ticket data for display ID and customer_id (needed for image uploads)
    const { data: ticketData } = await supabase
      .from('inquiries_v2')
      .select('display_id, customer_id')
      .eq('inquiry_id', inquiryId)
      .single();

    return {
      flowId: 'admin-review-ticket',
      context: {
        inquiry_id: inquiryId,
        customer_id: ticketData?.customer_id, // Include customer_id for file uploads
      },
      sessionTitle: getSessionTitle({
        flowId: 'admin-review-ticket',
        metadata: {
          context: {
            display_id: ticketData?.display_id,
          },
        },
        inquiry: { display_id: ticketData?.display_id },
      }),
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
      .select(
        `
        status,
        order_id,
        display_id,
        customer_id,
        session_id,
        customer:customer_id(customer_type)
      `
      )
      .eq('order_id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('⚠️ Could not find order data:', orderError);
      return null;
    }

    // VERIFYING_PAYMENT status → admin-verify-payment flow (regular) or admin-verify-payment-valued flow (valued customers)
    const normalizedStatus = (orderData.status || '').toLowerCase();

    if (normalizedStatus === 'verifying_payment') {
      const customerData = orderData.customer as any;
      const orderCustomerType = Array.isArray(customerData)
        ? customerData[0]?.customer_type
        : customerData?.customer_type;

      const normalizedCustomerType = (
        orderCustomerType || 'regular'
      ).toLowerCase();

      // Route valued customers to special flow that sets status to for_pickup/for_delivery
      const flowId =
        normalizedCustomerType === 'valued'
          ? 'admin-verify-payment-valued'
          : 'admin-verify-payment';

      return {
        flowId,
        context: {
          order_id: orderData.order_id,
          display_id: orderData.display_id,
          customer_id: orderData.customer_id,
          session_id: orderData.session_id,
          order_status: normalizedStatus,
          customer_type: normalizedCustomerType,
        },
        sessionTitle: getSessionTitle({
          flowId,
          metadata: {
            context: {
              display_id: orderData.display_id,
            },
          },
          order: { display_id: orderData.display_id },
        }),
      };
    }

    const customerData = orderData.customer as any;
    const orderCustomerType = Array.isArray(customerData)
      ? customerData[0]?.customer_type
      : customerData?.customer_type;

    const normalizedCustomerType = (
      orderCustomerType || 'regular'
    ).toLowerCase();

    const statusEligibleForAdminFlow = [
      'processing',
      'for_delivery',
      'for_pickup',
    ];

    if (statusEligibleForAdminFlow.includes(normalizedStatus)) {
      return {
        flowId: 'admin-change-order-status',
        context: {
          order_id: orderData.order_id,
          display_id: orderData.display_id,
          customer_id: orderData.customer_id,
          session_id: orderData.session_id,
          order_status: normalizedStatus,
          customer_type: normalizedCustomerType,
        },
        sessionTitle: getSessionTitle({
          flowId: 'admin-change-order-status',
          metadata: {
            context: {
              display_id: orderData.display_id,
            },
          },
          order: { display_id: orderData.display_id },
        }),
      };
    }
    return null;
  }

  /**
   * Get flow context for customer flows
   */
  static async getCustomerFlowContext(
    flowId: CustomerFlowId,
    entityId: string
  ): Promise<FlowContext | null> {
    switch (flowId) {
      case 'track-quote':
        return this.getCustomerTrackQuoteFlow(entityId);
      case 'track-ticket':
        return this.getCustomerTrackTicketFlow(entityId);
      case 'pay-order':
        return this.getCustomerPayOrderFlow(entityId);
      case 'reupload-payment':
        return this.getCustomerReuploadPaymentFlow(entityId);
      default:
        console.error(`Unknown customer flow: ${flowId}`);
        return null;
    }
  }

  /**
   * Customer track-quote flow
   */
  private static async getCustomerTrackQuoteFlow(
    quoteId: string
  ): Promise<FlowContext | null> {
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('quote_id, display_id, session_id')
      .eq('quote_id', quoteId)
      .single();

    if (!quoteData) {
      console.error('Could not find quote data for:', quoteId);
      return null;
    }

    return {
      flowId: 'track-quote',
      context: {
        quote_id: quoteData.quote_id,
        conversation_id: quoteData.session_id,
        conversationId: quoteData.session_id,
        display_id: quoteData.display_id,
      },
      sessionTitle: getSessionTitle({
        flowId: 'track-quote',
        metadata: { context: { display_id: quoteData.display_id } },
        quote: { display_id: quoteData.display_id },
      }),
    };
  }

  /**
   * Customer track-ticket flow
   */
  private static async getCustomerTrackTicketFlow(
    inquiryId: string
  ): Promise<FlowContext | null> {
    const { data: ticketData } = await supabase
      .from('inquiries_v2')
      .select('inquiry_id, display_id, inquiry_type')
      .eq('inquiry_id', inquiryId)
      .single();

    if (!ticketData) {
      console.error('Could not find ticket data for:', inquiryId);
      return null;
    }

    return {
      flowId: 'track-ticket',
      context: {
        inquiryId: ticketData.inquiry_id,
        inquiry_id: ticketData.inquiry_id,
        subject: ticketData.inquiry_type,
        display_id: ticketData.display_id,
      },
      sessionTitle: getSessionTitle({
        flowId: 'track-ticket',
        metadata: { context: { display_id: ticketData.display_id } },
        inquiry: { display_id: ticketData.display_id },
      }),
    };
  }

  /**
   * Customer pay-order flow
   */
  private static async getCustomerPayOrderFlow(
    orderId: string
  ): Promise<FlowContext | null> {
    const { data: orderData } = await supabase
      .from('orders')
      .select('order_id, display_id, total_amount')
      .eq('order_id', orderId)
      .single();

    if (!orderData) {
      console.error('Could not find order data for:', orderId);
      return null;
    }

    return {
      flowId: 'pay-order',
      context: {
        order_id: orderData.order_id,
        display_id: orderData.display_id,
        total_amount: orderData.total_amount?.toString(),
      },
      sessionTitle: getSessionTitle({
        flowId: 'pay-order',
        metadata: { context: { display_id: orderData.display_id } },
        order: { display_id: orderData.display_id },
      }),
    };
  }

  /**
   * Customer reupload-payment flow
   */
  private static async getCustomerReuploadPaymentFlow(
    orderId: string
  ): Promise<FlowContext | null> {
    const { data: orderData } = await supabase
      .from('orders')
      .select('order_id, display_id, total_amount')
      .eq('order_id', orderId)
      .single();

    if (!orderData) {
      console.error('Could not find order data for:', orderId);
      return null;
    }

    return {
      flowId: 'reupload-payment',
      context: {
        order_id: orderData.order_id,
        display_id: orderData.display_id,
        total_amount: orderData.total_amount?.toString(),
      },
      sessionTitle: getSessionTitle({
        flowId: 'reupload-payment',
        metadata: { context: { display_id: orderData.display_id } },
        order: { display_id: orderData.display_id },
      }),
    };
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
      orders: [
        'admin-verify-payment',
        'admin-verify-payment-valued',
        'admin-change-order-status',
      ],
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
      'admin-change-order-status',
    ];
    return instantFlows.includes(flowId);
  }
}
