/**
 * Unified session query patterns using FK relationships
 *
 * This file provides standardized query functions that leverage the new foreign key
 * relationships between inquiries, chat_sessions_v2, and quotes tables.
 *
 * @example
 * ```typescript
 * // Get all user sessions with related data
 * const sessions = await getUserSessions(userId);
 *
 * // Get specific inquiry with its session
 * const inquiry = await getInquiryWithSession(inquiryId);
 *
 * // Get specific quote with its session
 * const quote = await getQuoteWithSession(quoteId);
 * ```
 */

import { supabase } from '@lib/supabase';

export interface SessionWithRelations {
  sessionId: string;
  flowId: string;
  status: string;
  createdAt: number;
  currentNodeId?: string;
  metadata?: any;
  inquiry?: {
    inquiry_id: string;
    display_id: string;
    inquiry_type: string;
    inquiry_status: string;
  };
  quote?: {
    quote_id: string;
    display_id: string;
    status: string;
    total_price?: number;
  };
  order?: {
    order_id: string;
    display_id: string;
    status: string;
  };
  type: 'inquiry' | 'quote' | 'general' | 'order';
}

export interface InquiryWithSession {
  inquiry_id: string;
  display_id: string;
  customer_id: string;
  inquiry_type: string;
  inquiry_status: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  order_id?: string | null;
  session_id?: string;
  session?: {
    session_id: string;
    status: string;
    metadata: any;
  };
  // Additional camelCase fields for hooks
  inquiryId: string;
  displayId: string;
  inquiryType: string;
  inquiryStatus: string;
  createdAt: number;
  updatedAt?: number;
  resolvedAt?: number;
  orderId?: string | null;
}

export interface QuoteWithSession {
  quote_id: string;
  display_id: string;
  customer_id: string;
  status: string;
  proposal_id?: string;
  total_price?: number;
  quoted_price?: number;
  created_at: string;
  updated_at?: string;
  session_id?: string;
  session?: {
    session_id: string;
    status: string;
    metadata: any;
  };
  // Additional camelCase fields for hooks
  quoteId: string;
  displayId: string;
  createdAt: number;
  updatedAt?: number;
  endedAt?: number;
}

/**
 * Get all sessions for a user with their related inquiry and quote data
 *
 * @internal - Should only be called by SessionCacheProvider
 * @deprecated For application code, use useSessionCache() or useCustomerConversations() instead
 *
 * ⚠️ WARNING: This function is part of the internal session loading mechanism.
 * Direct use in application code will cause duplicate queries and performance issues.
 *
 * @param userId - The customer's user ID
 * @returns Array of sessions with FK relationships populated
 *
 * @example
 * // ❌ DON'T use directly in components
 * const sessions = await getUserSessions(userId);
 *
 * // ✅ DO use via SessionCache
 * const { sessions } = useSessionCache();
 *
 * // ✅ OR use via CustomerConversations
 * const { conversations } = useCustomerConversationsContext();
 */
export async function getUserSessions(
  userId: string
): Promise<SessionWithRelations[]> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select(
      `
      session_id,
      flow_id,
      status,
      created_at,
      metadata,
      inquiry:inquiries_v2!inquiry_id(
        inquiry_id,
        display_id,
        inquiry_type,
        inquiry_status
      ),
      quote:quotes!quote_id(
        quote_id,
        display_id,
        status
      ),
      order:orders!order_id(
        order_id,
        display_id,
        status
      )
    `
    )
    .eq('customer_id', userId)
    .is('metadata->ticket_conversation', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch user sessions:', error);
    return [];
  }

  return data.map(session => ({
    sessionId: session.session_id,
    flowId: session.flow_id,
    status: session.status,
    createdAt: new Date(session.created_at).getTime(),
    currentNodeId: session.metadata?.current_node_id,
    metadata: session.metadata,
    inquiry: Array.isArray(session.inquiry)
      ? session.inquiry[0]
      : session.inquiry,
    quote: Array.isArray(session.quote) ? session.quote[0] : session.quote,
    order: Array.isArray(session.order) ? session.order[0] : session.order,
    type: session.inquiry
      ? 'inquiry'
      : session.quote
        ? 'quote'
        : session.order
          ? 'order'
          : 'general',
  }));
}

/**
 * Get an inquiry with its associated session data
 */
export async function getInquiryWithSession(
  inquiryId: string
): Promise<InquiryWithSession | null> {
  const { data, error } = await supabase
    .from('inquiries')
    .select(
      `
      *,
      session:chat_sessions_v2!session_id(
        session_id,
        status,
        metadata,
        created_at
      )
    `
    )
    .eq('inquiry_id', inquiryId)
    .single();

  if (error) {
    console.error('Failed to fetch inquiry with session:', error);
    return null;
  }

  return data;
}

/**
 * Get a quote with its associated session data
 */
export async function getQuoteWithSession(
  quoteId: string
): Promise<QuoteWithSession | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select(
      `
      *,
      session:chat_sessions_v2!session_id(
        session_id,
        status,
        metadata,
        created_at
      )
    `
    )
    .eq('quote_id', quoteId)
    .single();

  if (error) {
    console.error('Failed to fetch quote with session:', error);
    return null;
  }

  return data;
}

/**
 * Get all sessions for a specific inquiry (should be max 1 due to FK relationship)
 */
export async function getSessionsForInquiry(
  inquiryId: string
): Promise<SessionWithRelations[]> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select(
      `
      session_id,
      flow_id,
      status,
      created_at,
      metadata,
      inquiry:inquiries_v2!inquiry_id(
        inquiry_id,
        display_id,
        inquiry_type,
        inquiry_status
      ),
      quote:quotes!quote_id(
        quote_id,
        display_id,
        status
      )
    `
    )
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sessions for inquiry:', error);
    return [];
  }

  return data.map(session => ({
    sessionId: session.session_id,
    flowId: session.flow_id,
    status: session.status,
    createdAt: new Date(session.created_at).getTime(),
    currentNodeId: session.metadata?.current_node_id,
    inquiry: Array.isArray(session.inquiry)
      ? session.inquiry[0]
      : session.inquiry,
    quote: Array.isArray(session.quote) ? session.quote[0] : session.quote,
    type: session.inquiry ? 'inquiry' : session.quote ? 'quote' : 'general',
  }));
}

/**
 * Get all sessions for a specific quote (should be max 1 due to FK relationship)
 */
export async function getSessionsForQuote(
  quoteId: string
): Promise<SessionWithRelations[]> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select(
      `
      session_id,
      flow_id,
      status,
      created_at,
      metadata,
      inquiry:inquiries_v2!inquiry_id(
        inquiry_id,
        display_id,
        inquiry_type,
        inquiry_status
      ),
      quote:quotes!quote_id(
        quote_id,
        display_id,
        status
      )
    `
    )
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sessions for quote:', error);
    return [];
  }

  return data.map(session => ({
    sessionId: session.session_id,
    flowId: session.flow_id,
    status: session.status,
    createdAt: new Date(session.created_at).getTime(),
    currentNodeId: session.metadata?.current_node_id,
    inquiry: Array.isArray(session.inquiry)
      ? session.inquiry[0]
      : session.inquiry,
    quote: Array.isArray(session.quote) ? session.quote[0] : session.quote,
    type: session.inquiry ? 'inquiry' : session.quote ? 'quote' : 'general',
  }));
}

/**
 * Get messages for a session with sender information
 */
export async function getSessionMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('chat_messages_v2')
    .select(
      `
      message_id,
      sender_role,
      message_text_enc,
      sent_at,
      metadata
    `
    )
    .eq('session_id', sessionId)
    .order('sent_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch session messages:', error);
    return [];
  }

  return data;
}

/**
 * Create a new session with proper FK relationships
 */
export async function createSessionWithFKs(params: {
  customerId: string;
  flowId: string;
  inquiryId?: string;
  quoteId?: string;
  metadata?: any;
}): Promise<{ sessionId: string } | null> {
  const { customerId, flowId, inquiryId, quoteId, metadata = {} } = params;

  const sessionId = crypto.randomUUID();

  const { error } = await supabase.from('chat_sessions_v2').insert({
    session_id: sessionId,
    customer_id: customerId,
    flow_id: flowId,
    status: 'active',
    inquiry_id: inquiryId || null,
    quote_id: quoteId || null,
    metadata: {
      current_node_id: metadata.current_node_id || 'intro',
      context: metadata.context || {},
      ...metadata,
    },
  });

  if (error) {
    console.error('Failed to create session:', error);
    return null;
  }

  return { sessionId };
}

/**
 * Link an existing inquiry to a session (bidirectional relationship)
 */
export async function linkInquiryToSession(
  inquiryId: string,
  sessionId: string
): Promise<boolean> {
  const { error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .update({ inquiry_id: inquiryId })
    .eq('session_id', sessionId);

  if (sessionError) {
    console.error('Failed to link inquiry to session:', sessionError);
    return false;
  }

  const { error: inquiryError } = await supabase
    .from('inquiries')
    .update({ session_id: sessionId })
    .eq('inquiry_id', inquiryId);

  if (inquiryError) {
    console.error('Failed to link session to inquiry:', inquiryError);
    return false;
  }

  return true;
}

/**
 * Link an existing quote to a session (bidirectional relationship)
 */
export async function linkQuoteToSession(
  quoteId: string,
  sessionId: string
): Promise<boolean> {
  const { error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .update({ quote_id: quoteId })
    .eq('session_id', sessionId);

  if (sessionError) {
    console.error('Failed to link quote to session:', sessionError);
    return false;
  }

  const { error: quoteError } = await supabase
    .from('quotes')
    .update({ session_id: sessionId })
    .eq('quote_id', quoteId);

  if (quoteError) {
    console.error('Failed to link session to quote:', quoteError);
    return false;
  }

  return true;
}

/**
 * Get all inquiry sessions for admin view
 */
export async function getAdminInquirySessions(): Promise<
  SessionWithRelations[]
> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select(
      `
      session_id,
      flow_id,
      status,
      created_at,
      metadata,
      inquiry:inquiries_v2!inquiry_id(
        inquiry_id,
        display_id,
        inquiry_type,
        inquiry_status
      ),
      quote:quotes!quote_id(
        quote_id,
        display_id,
        status
      )
    `
    )
    .not('inquiry_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch admin inquiry sessions:', error);
    return [];
  }

  return data.map(session => ({
    sessionId: session.session_id,
    flowId: session.flow_id,
    status: session.status,
    createdAt: new Date(session.created_at).getTime(),
    currentNodeId: session.metadata?.current_node_id,
    inquiry: Array.isArray(session.inquiry)
      ? session.inquiry[0]
      : session.inquiry,
    quote: Array.isArray(session.quote) ? session.quote[0] : session.quote,
    type: session.inquiry ? 'inquiry' : session.quote ? 'quote' : 'general',
  }));
}

/**
 * Get customer inquiries with session data
 */
export async function getCustomerInquiries(
  customerId: string
): Promise<InquiryWithSession[]> {
  const { data, error } = await supabase
    .from('inquiries_v2')
    .select(
      `
      inquiry_id,
      display_id,
      customer_id,
      inquiry_type,
      inquiry_status,
      created_at:received_at,
      session_id,
      order_id,
      updated_at,
      resolved_at,
      session:chat_sessions_v2!session_id(
        session_id,
        status,
        metadata,
        created_at
      )
    `
    )
    .eq('customer_id', customerId)
    .order('received_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch customer inquiries:', error);
    return [];
  }

  return data.map(inquiry => ({
    inquiry_id: inquiry.inquiry_id,
    display_id: inquiry.display_id,
    customer_id: inquiry.customer_id,
    inquiry_type: inquiry.inquiry_type,
    inquiry_status: inquiry.inquiry_status,
    created_at: inquiry.created_at,
    updated_at: inquiry.updated_at,
    resolved_at: inquiry.resolved_at,
    order_id: inquiry.order_id,
    session_id: inquiry.session_id,
    session: Array.isArray(inquiry.session)
      ? inquiry.session[0]
      : inquiry.session,
    // Additional fields for hooks
    inquiryId: inquiry.inquiry_id,
    displayId: inquiry.display_id,
    inquiryType: inquiry.inquiry_type,
    inquiryStatus: inquiry.inquiry_status,
    createdAt: new Date(inquiry.created_at).getTime(),
    updatedAt: inquiry.updated_at
      ? new Date(inquiry.updated_at).getTime()
      : undefined,
    resolvedAt: inquiry.resolved_at
      ? new Date(inquiry.resolved_at).getTime()
      : undefined,
    orderId: inquiry.order_id,
  }));
}

/**
 * Get customer quotes with session data
 */
export async function getCustomerQuotes(
  customerId: string
): Promise<QuoteWithSession[]> {
  // Optimized query with JOIN to fetch proposal data in one call
  const { data, error } = await supabase
    .from('quotes')
    .select(
      `
      quote_id,
      display_id,
      customer_id,
      status,
      proposal_id,
      created_at,
      updated_at,
      ended_at,
      session_id,
      session:chat_sessions_v2!session_id(
        session_id,
        status,
        metadata,
        created_at
      ),
      quote_proposals(
        quoted_price
      )
    `
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch customer quotes:', error);
    return [];
  }

  // Process joined data - no more N+1 queries!
  const quotesWithPrices = data.map(quote => {
    const proposalsRaw = quote.quote_proposals as any;
    // Handle Supabase JOIN data structure - can be array or single object
    const proposals = Array.isArray(proposalsRaw)
      ? proposalsRaw
      : [proposalsRaw].filter(Boolean);
    const quotedPrice =
      proposals && proposals.length > 0
        ? proposals[0]?.quoted_price
        : undefined;

    return {
      quote_id: quote.quote_id,
      display_id: quote.display_id,
      customer_id: quote.customer_id,
      status: quote.status,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      ended_at: quote.ended_at,
      session_id: quote.session_id,
      session: Array.isArray(quote.session) ? quote.session[0] : quote.session,
      quoted_price: quotedPrice,
      // Additional fields for hooks
      quoteId: quote.quote_id,
      displayId: quote.display_id,
      createdAt: new Date(quote.created_at).getTime(),
      updatedAt: quote.updated_at
        ? new Date(quote.updated_at).getTime()
        : undefined,
      endedAt: quote.ended_at ? new Date(quote.ended_at).getTime() : undefined,
    };
  });

  return quotesWithPrices;
}
