import { supabase } from '@lib/supabase';

// --- GLOBAL CONFIGURATION CONSTANTS ---

/**
 * These are the flow_ids that signify a user has requested human assistance,
 * a quote, or initiated a formal ticket/process requiring human intervention.
 */
const ESCALATION_FLOW_IDS = [
  'ask-assistance',
  'ask-quote',
  'issue-ticket',
  'track-quote',
];

/**
 * These are the flow_ids that signify a user has requested assistance specifically
 * related to the status of an existing order or quote, used for KPI 8.
 */
const ORDER_STATUS_INQUIRY_FLOW_IDS = [
  'track-order',
  'track-quote',
  'ask-assistance',
];

/**
 * Interface for standard date range filtering.
 * Dates should be provided in a valid string format (e.g., 'YYYY-MM-DD' or ISO 8601).
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Helper function to calculate the date string for the day immediately following the input date.
 */
function getNextDayString(dateString: string): string {
  // Use a Date object initialized with UTC to avoid local timezone effects
  const date = new Date(dateString + 'T00:00:00Z');
  // Add 24 hours (in milliseconds)
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000);

  // Format back to YYYY-MM-DD
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// NOTE: parseTimestampToMilliseconds and timestampInRange removed as filtering is now done by Supabase/PostgreSQL.


// --- KPI 1: First Contact Resolution Rate ---
export async function getFirstContactResolutionRate(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 1] Fetching FCR Rate for range: ${range.startDate} to ${range.endDate}`
  );
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalSessions, error: countError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (countError || totalSessions === null || totalSessions === 0) {
    console.warn('[KPI 1 WARNING] No total chat sessions found in the range.');
    return 0;
  }

  const { data: escalatedFlows, error: flowError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .in('flow_id', ESCALATION_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (flowError || !escalatedFlows) return null;

  const escalatedSessionIds = Array.from(
    new Set(escalatedFlows.map(f => f.session_id))
  );

  const { data: endedSessions, error: endedSessionsError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .eq('status', 'ended')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (endedSessionsError || !endedSessions) return null;

  const escalatedSet = new Set(escalatedSessionIds);
  const nonEscalatedResolvedSessions = endedSessions.filter(
    session => !escalatedSet.has(session.session_id)
  );

  const resolvedByPrinty = nonEscalatedResolvedSessions.length;
  return (resolvedByPrinty / totalSessions) * 100;
}

// --- KPI 2: Average Initial Response Time ---
/**
 * Uses the security function 'get_admin_initial_response' and applies server-side date filtering.
 */
export async function getAverageInitialResponseTime(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 2] Fetching Avg Initial Response Time for range: ${range.startDate} to ${range.endDate}`
  );
  
  const exclusiveEndDate = getNextDayString(range.endDate);

  // FIX: Apply date filtering directly to the RPC call (server-side)
  const { data: responseData, error: rpcError } = await supabase
    .rpc('get_admin_initial_response')
    .gte('customer_first_at', range.startDate)
    .lt('customer_first_at', exclusiveEndDate); // Ensure column name matches view

  if (rpcError || !responseData || responseData.length === 0) {
    console.warn('[KPI 2 WARNING] No initial responses returned by RPC.');
    // IMPORTANT: If you still see failures after this fix, the issue is Auth.uid() failing.
    console.error('[KPI 2 RPC ERROR]', rpcError); 
    return null;
  }

  const times = (responseData as any[])
    .map(r => Number(r.response_time_seconds))
    .filter(v => Number.isFinite(v) && v >= 0);

  if (times.length === 0) return null;

  const totalResponseTime = times.reduce((sum, t) => sum + t, 0);
  return totalResponseTime / times.length;
}


// --- KPI 3: Average Customer Satisfaction Score ---
export async function getAverageCustomerSatisfactionScore(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 3] Fetching Avg CSAT for range: ${range.startDate} to ${range.endDate}`
  );

  const exclusiveEndDate = getNextDayString(range.endDate);

  const { data, error } = await supabase
    .from('chat_session_feedback')
    .select('rating')
    .gte('submitted_at', range.startDate)
    .lt('submitted_at', exclusiveEndDate);

  if (error) {
    console.error('[KPI 3 ERROR] Failed to fetch feedback:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn('[KPI 3 WARNING] No feedback data found in the range.');
    return 0;
  }

  const avgRating = data.reduce((sum, f) => sum + f.rating, 0) / data.length;
  console.log(
    `[KPI 3 SUCCESS] Calculated average CSAT: ${avgRating.toFixed(2)}`
  );
  return avgRating;
} 

// --- KPI 4: Escalation Rate ---
export async function getEscalationRate(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 4] Fetching Escalation Rate for range: ${range.startDate} to ${range.endDate}`
  );
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalSessions, error: countError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (countError || totalSessions === null || totalSessions === 0) return 0;

  const { data: escalatedFlows, error: flowError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .in('flow_id', ESCALATION_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (flowError || !escalatedFlows) return null;

  const escalatedSessionIds = Array.from(
    new Set(escalatedFlows.map(f => f.session_id))
  );
  const totalEscalated = escalatedSessionIds.length;

  return (totalEscalated / totalSessions) * 100;
}

// --- KPI 5: Average Service Request Throughput Time (SRTT) ---

/**
 * Primary Logic: SRTT based on orders linked to a chat-generated quote_id.
 * FIX: Apply server-side date filtering.
 */
async function calculateSrttByQuoteLinkage(
  range: DateRange,
  exclusiveEndDate: string
): Promise<{ time: number; count: number } | null> {

  // FIX: Apply date filtering directly to the RPC call (server-side)
  const { data: throughputData, error: rpcError } = await supabase
    .rpc('get_admin_srt_by_quote')
    .gte('order_created_at', range.startDate) // Ensure column name matches view
    .lt('order_created_at', exclusiveEndDate); // Ensure column name matches view

  if (rpcError || !throughputData || throughputData.length === 0) {
    return null;
  }

  const times = (throughputData as any[])
    .map(r => Number(r.throughput_seconds))
    .filter(v => Number.isFinite(v) && v >= 0);
    
  if (times.length === 0) return null;

  return { time: times.reduce((s, v) => s + v, 0), count: times.length };
}

/**
 * KPI 5 Fallback Logic: Calculates SRTT by finding the LATEST CHAT SESSION START TIME
 * FIX: Apply server-side date filtering.
 */
async function calculateSrttByCustomerLinkage(
  range: DateRange,
  exclusiveEndDate: string
): Promise<{ time: number; count: number } | null> {

  // FIX: Apply date filtering directly to the RPC call (server-side)
  const { data: throughputData, error: rpcError } = await supabase
    .rpc('get_admin_srt_by_customer')
    .gte('order_created_at', range.startDate) // Ensure column name matches view
    .lt('order_created_at', exclusiveEndDate); // Ensure column name matches view

  if (rpcError || !throughputData || throughputData.length === 0) {
    return null;
  }

  const times = (throughputData as any[])
    .map(r => Number(r.throughput_seconds))
    .filter(v => Number.isFinite(v) && v >= 0);
    
  if (times.length === 0) return null;

  return { time: times.reduce((s, v) => s + v, 0), count: times.length };
}

export async function getAverageServiceRequestThroughputTime(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 5] Fetching Avg SRTT for range: ${range.startDate} to ${range.endDate}`
  );

  const exclusiveEndDate = getNextDayString(range.endDate);

  // PRIMARY LOGIC: Quote-Linked
  const primaryResult = await calculateSrttByQuoteLinkage(
    range,
    exclusiveEndDate
  );

  if (primaryResult) {
    console.log(
      `[KPI 5 DEBUG] Primary (Quote-Linked) SRTT calculated using ${primaryResult.count} orders.`
    );
    return primaryResult.time / primaryResult.count;
  }

  // FALLBACK LOGIC: Customer-Linked
  const fallbackResult = await calculateSrttByCustomerLinkage(
    range,
    exclusiveEndDate
  );

  if (fallbackResult) {
    console.log(
      `[KPI 5 DEBUG] Fallback (Customer-Linked) SRTT calculated using ${fallbackResult.count} orders.`
    );
    return fallbackResult.time / fallbackResult.count;
  }

  console.warn(
    '[KPI 5 WARNING] Could not calculate SRTT using either Primary (Quote-Linked) or Fallback (Customer-Linked) logic.'
  );
  return null;
}

// --- KPI 6: Percentage of Service Requests Initiated via PRINTY ---
async function getOrdersSourcedFromChatByQuoteLinkage(
  range: DateRange,
  exclusiveEndDate: string
): Promise<number | null> {
  // 1. Get all unique quote_ids generated by chat sessions
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('quote_id')
    .not('quote_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessionError || !sessions) return null;

  const quotedInChatIds = Array.from(
    new Set(
      sessions.map(s => s.quote_id).filter((id): id is string => id !== null)
    )
  );

  if (quotedInChatIds.length === 0) return 0;

  // 2. Count orders placed that match one of the quote IDs
  const { count: ordersCount, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .in('quote_id', quotedInChatIds)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderError || ordersCount === null) return null;

  return ordersCount;
}

/**
 * Fallback Logic: Orders placed by ANY customer who had a chat session in the range.
 */
async function getOrdersSourcedFromChatByCustomerLinkage(
  range: DateRange,
  exclusiveEndDate: string
): Promise<number | null> {
  console.warn(
    '[KPI 6 FALLBACK] Falling back to less precise Customer-Linked Sourced Orders calculation.'
  );

  // 1. Get all unique customer IDs that started a chat session in the range
  const { data: chatCustomers, error: chatError } = await supabase
    .from('chat_sessions_v2')
    .select('customer_id')
    .not('customer_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (chatError || !chatCustomers || chatCustomers.length === 0) return 0;

  const chattingCustomerIds = Array.from(
    new Set(chatCustomers.map(c => c.customer_id))
  );

  // 2. Count orders placed by those same customer IDs in the range
  const { count: ordersCount, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .in('customer_id', chattingCustomerIds)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderError || ordersCount === null) return null;

  return ordersCount;
}

export async function getOrdersSourcedFromChatRate(
  range: DateRange,
  ordersFromOtherChannels: number
): Promise<number | null> {
  console.log(
    `[KPI 6] Fetching Chat Sourced Orders Rate for range: ${range.startDate} to ${range.endDate}`
  );

  const exclusiveEndDate = getNextDayString(range.endDate);

  // PRIMARY LOGIC: Quote-Linked
  let totalOrdersViaPrinty = await getOrdersSourcedFromChatByQuoteLinkage(
    range,
    exclusiveEndDate
  );

  if (totalOrdersViaPrinty === null || totalOrdersViaPrinty === 0) {
    // FALLBACK LOGIC: Customer-Linked
    totalOrdersViaPrinty = await getOrdersSourcedFromChatByCustomerLinkage(
      range,
      exclusiveEndDate
    );
    if (totalOrdersViaPrinty === null) return null;
  } else {
    console.log(
      `[KPI 6 DEBUG] Primary (Quote-Linked) Sourced Orders: ${totalOrdersViaPrinty}`
    );
  }

  const totalAllRequests = totalOrdersViaPrinty + ordersFromOtherChannels;

  if (totalAllRequests === 0) return 0;

  return (totalOrdersViaPrinty / totalAllRequests) * 100;
}

// --- KPI 7: Job Order Accuracy Rate (JOAR) ---
export async function getJobOrderAccuracyRate(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 7] Fetching JOAR for range: ${range.startDate} to ${range.endDate}`
  );

  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalOrders, error: totalOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (totalOrdersError || totalOrders === null || totalOrders === 0) return 0;

  const { count: accurateOrders, error: accurateOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate)
    .neq('status', 'cancelled');

  if (accurateOrdersError || accurateOrders === null) return null;

  return (accurateOrders / totalOrders) * 100;
}

// --- KPI 8: Order Status Inquiry Rate ---
async function getRawOrderStatusInquiryTriggersByInquiryId(
  range: DateRange,
  exclusiveEndDate: string
): Promise<number | null> {
  // Primary Logic: Count unique inquiry_ids
  const { data: inquirySessions, error: dataError } = await supabase
    .from('chat_sessions_v2')
    .select('inquiry_id')
    .in('flow_id', ORDER_STATUS_INQUIRY_FLOW_IDS)
    .not('inquiry_id', 'is', null) // Only count if a related inquiry_id was generated
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (dataError || !inquirySessions) return null;

  const uniqueInquiryIds = Array.from(
    new Set(inquirySessions.map(s => s.inquiry_id))
  );

  return uniqueInquiryIds.length;
}

async function getRawOrderStatusInquiryTriggersByFlowId(
  range: DateRange,
  exclusiveEndDate: string
): Promise<number | null> {
  console.warn(
    '[KPI 8 FALLBACK] Falling back to less precise Flow-ID Inquiries calculation (may overcount).'
  );

  // Fallback Logic: Count all sessions that hit the inquiry flow
  const { count: flowCount, error: countError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .in('flow_id', ORDER_STATUS_INQUIRY_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (countError || flowCount === null) return null;
  return flowCount;
}

export async function getOrderStatusInquiryRate(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 8] Fetching Order Status Inquiry Rate for range: ${range.startDate} to ${range.endDate}`
  );

  const exclusiveEndDate = getNextDayString(range.endDate);

  // PRIMARY LOGIC: Unique Inquiry ID
  let totalInquiries = await getRawOrderStatusInquiryTriggersByInquiryId(
    range,
    exclusiveEndDate
  );

  if (totalInquiries === null || totalInquiries === 0) {
    // FALLBACK LOGIC: Flow ID Count
    totalInquiries = await getRawOrderStatusInquiryTriggersByFlowId(
      range,
      exclusiveEndDate
    );
    if (totalInquiries === null) return null;
  } else {
    console.log(
      `[KPI 8 DEBUG] Primary (Inquiry-ID) Inquiries Counted: ${totalInquiries}`
    );
  }

  const { count: totalOrders, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderError || totalOrders === null || totalOrders === 0) {
    return totalInquiries > 0 ? null : 0;
  }

  return totalInquiries / totalOrders;
}

// --- KPI 9: Up-To-Date Service Portfolio Rate ---
export async function getUpToDateServicePortfolioRate(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 9] Fetching Portfolio Rate for range: ${range.startDate} to ${range.endDate}`
  );
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalServices, error: totalError } = await supabase
    .from('printing_services')
    .select('service_id', { count: 'exact', head: true });

  if (totalError || totalServices === null || totalServices === 0) return 0;

  const { count: updatedServices, error: updatedError } = await supabase
    .from('printing_services')
    .select('service_id', { count: 'exact', head: true })
    .gte('updated_at', range.startDate)
    .lt('updated_at', exclusiveEndDate);

  if (updatedError || updatedServices === null) return 0;

  return (updatedServices / totalServices) * 100;
}

// --- KPI 10: Service Portfolio Utilization Rate (SPUR) ---
export async function getServicePortfolioUtilizationRate(
  range: DateRange
): Promise<number | null> {
  console.log(
    `[KPI 10] Fetching SPUR for range: ${range.startDate} to ${range.endDate}`
  );
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalSessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessionError || totalSessions === null) return null;

  if (totalSessions === 0) return 0;

  const { count: totalOrders, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderError || totalOrders === null) return null;

  const totalOrdersCreated = totalOrders;

  return (totalOrdersCreated / totalSessions) * 100;
}