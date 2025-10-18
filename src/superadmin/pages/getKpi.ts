import { createClient } from '@supabase/supabase-js';

// Configuration is now correctly reading environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- GLOBAL CONFIGURATION CONSTANTS ---

/**
 * These are the flow_ids that signify a user has requested human assistance, 
 * a quote, or initiated a formal ticket/process requiring human intervention.
 */
const ESCALATION_FLOW_IDS = [
  'ask-assistance', 
  'ask-quote', 
  'issue-ticket', 
  'track-quote'
];

/**
 * These are the flow_ids that signify a user has requested assistance specifically 
 * related to the status of an existing order or quote, used for KPI 8.
 */
const ORDER_STATUS_INQUIRY_FLOW_IDS = [
  'track-order', 
  'track-quote', 
  'ask-assistance'
];

// --- DEBUG INITIALIZATION ---
console.log('--- Supabase Client Initialization ---');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ----------------------------


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
  date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
  
  // Format back to YYYY-MM-DD
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}


/**
 * Helper function to parse a PostgreSQL timestamp string (which includes up to 6 digits for microseconds)
 * into a floating-point number representing milliseconds since the Unix epoch.
 */
function parseTimestampToMilliseconds(timestamp: string): number {
    const date = new Date(timestamp);
    let ms = date.getTime();
    const microsecondMatch = timestamp.match(/\.(\d{3})(\d{3})/);

    if (microsecondMatch) {
        const microsecondRemainder = parseInt(microsecondMatch[2], 10);
        const msFraction = microsecondRemainder / 1000;
        ms += msFraction;
    }
    return ms;
}


// --- KPI 1: First Contact Resolution Rate ---
export async function getFirstContactResolutionRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 1] Fetching FCR Rate for range: ${range.startDate} to ${range.endDate}`);
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

  const escalatedSessionIds = Array.from(new Set(escalatedFlows.map(f => f.session_id)));

  const { data: endedSessions, error: endedSessionsError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .eq('status', 'ended')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (endedSessionsError || !endedSessions) return null;
  
  const escalatedSet = new Set(escalatedSessionIds);
  const nonEscalatedResolvedSessions = endedSessions.filter(session => 
    !escalatedSet.has(session.session_id)
  );

  const resolvedByPrinty = nonEscalatedResolvedSessions.length;
  return (resolvedByPrinty / totalSessions) * 100;
}

// --- KPI 2: Average Initial Response Time ---
export async function getAverageInitialResponseTime(range: DateRange): Promise<number | null> {
  console.log(`[KPI 2] Fetching Avg Initial Response Time for range: ${range.startDate} to ${range.endDate}`);
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessionError || !sessions || sessions.length === 0) return null;

  const sessionIds = sessions.map(s => s.session_id);
  
  const { data: combinedMessages, error: combinedError } = await supabase
    .from('chat_messages_v2')
    .select(`
      session_id,
      sent_at,
      sender_role,
      metadata
    `)
    .in('session_id', sessionIds)
    .order('sent_at', { ascending: true });

  if (combinedError || !combinedMessages || combinedMessages.length === 0) return null;

  const groupedMessages = combinedMessages.reduce((acc, msg) => {
    const sender_role = msg.sender_role;
    if (!sender_role) return acc;

    const messageWithRole = {
      session_id: msg.session_id,
      sent_at: msg.sent_at,
      sender_role: sender_role,
    };

    if (!acc.has(msg.session_id)) {
      acc.set(msg.session_id, []);
    }
    acc.get(msg.session_id)?.push(messageWithRole);
    return acc;
  }, new Map<string, Array<{ session_id: string, sent_at: string, sender_role: string }>>());


  let totalResponseTime = 0;
  let count = 0;

  for (const sessionMessages of groupedMessages.values()) {
    let customerMsgTime: number | null = null;
    let printyMsgTime: number | null = null;

    for (const msg of sessionMessages) {
        if (msg.sender_role === 'customer' && customerMsgTime === null) {
            customerMsgTime = parseTimestampToMilliseconds(msg.sent_at);
        } 
        else if (msg.sender_role === 'printy' && customerMsgTime !== null) {
            printyMsgTime = parseTimestampToMilliseconds(msg.sent_at);
            if (printyMsgTime > customerMsgTime) { 
                break;
            }
        }
    }

    if (customerMsgTime !== null && printyMsgTime !== null) {
        totalResponseTime += (printyMsgTime - customerMsgTime) / 1000;
        count++;
    } 
  }

  if (count === 0) return null;
  
  return totalResponseTime / count;
}

// --- KPI 3: Average Customer Satisfaction Score ---
export async function getAverageCustomerSatisfactionScore(range: DateRange): Promise<number | null> {
  console.log(`[KPI 3] Fetching Avg CSAT for range: ${range.startDate} to ${range.endDate}`);
  console.warn('[KPI 3 WARNING] CSAT calculation is currently disabled/non-functional because the feedback column is missing from the chat_sessions_v2 table. Returning 0.');
  return 0;
}

// --- KPI 4: Escalation Rate ---
export async function getEscalationRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 4] Fetching Escalation Rate for range: ${range.startDate} to ${range.endDate}`);
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

  const escalatedSessionIds = Array.from(new Set(escalatedFlows.map(f => f.session_id)));
  const totalEscalated = escalatedSessionIds.length;
  
  return (totalEscalated / totalSessions) * 100;
}


// --- KPI 5: Average Service Request Throughput Time (SRTT) ---

/**
 * Primary Logic: SRTT based on orders linked to a chat-generated quote_id.
 */
async function calculateSrttByQuoteLinkage(range: DateRange, exclusiveEndDate: string): Promise<{ time: number, count: number } | null> {
  // 1. Get all orders in the range that have a quote_id
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('order_id, quote_id, created_at')
    .not('quote_id', 'is', null) // Primary Logic: Only consider orders linked to a quote
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderError || !orders || orders.length === 0) {
    return null; // Return null if primary data is missing
  }

  const orderQuoteIds = Array.from(new Set(orders.map(o => o.quote_id)));
  
  // 2. Get the chat session start time for all relevant quotes
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('quote_id, created_at')
    .in('quote_id', orderQuoteIds);

  if (sessionError || !sessions || sessions.length === 0) {
    return null; 
  }
  
  const sessionStartTimeMap = new Map<string, string>();
  for (const session of sessions) {
      // Find the EARLIEST session associated with a quote_id to mark the request start
      if (!sessionStartTimeMap.has(session.quote_id) || new Date(session.created_at) < new Date(sessionStartTimeMap.get(session.quote_id)!)) {
          sessionStartTimeMap.set(session.quote_id, session.created_at);
      }
  }

  let totalThroughputTime = 0;
  let calculatedOrdersCount = 0;

  // 3. Calculate throughput time for each linked order
  for (const order of orders) {
    const sessionStartTime = sessionStartTimeMap.get(order.quote_id);
    
    if (sessionStartTime) {
      const sessionTimeMs = new Date(sessionStartTime).getTime();
      const orderTimeMs = new Date(order.created_at).getTime();
      
      if (orderTimeMs >= sessionTimeMs) {
          totalThroughputTime += (orderTimeMs - sessionTimeMs) / 1000;
          calculatedOrdersCount++;
      }
    }
  }

  if (calculatedOrdersCount === 0) return null; 
  
  return { time: totalThroughputTime, count: calculatedOrdersCount };
}

/**
 * KPI 5 Fallback Logic: Calculates SRTT by finding the LATEST CHAT SESSION START TIME 
 * for a customer that occurred BEFORE their order was placed. (Corrected logic)
 */
async function calculateSrttByCustomerLinkage(range: DateRange, exclusiveEndDate: string): Promise<{ time: number, count: number } | null> {
    console.warn('[KPI 5 FALLBACK] Falling back to Customer-Linked SRTT calculation (using LATEST session start time before order).');

    // 1. Get all orders in the range with customer_id
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('order_id, customer_id, created_at')
        .not('customer_id', 'is', null)
        .gte('created_at', range.startDate)
        .lt('created_at', exclusiveEndDate);

    if (orderError || !orders || orders.length === 0) return null;

    const allCustomerIds = Array.from(new Set(
        orders.map(o => o.customer_id).filter((id): id is string => !!id)
    ));

    if (allCustomerIds.length === 0) return null;
    
    // 2. Fetch all relevant chat session start times for the customers in the range
    // NOTE: We order by DESCENDING created_at to easily find the LATEST session in step 4.
    const { data: allSessions, error: sessionError } = await supabase
        .from('chat_sessions_v2')
        .select('customer_id, created_at')
        .in('customer_id', allCustomerIds)
        .order('created_at', { ascending: false }); // <-- Critical: Order DESCENDING

    if (sessionError || !allSessions || allSessions.length === 0) {
        console.error("[KPI 5 FALLBACK ERROR] Failed to fetch customer sessions for SRTT fallback:", sessionError);
        return null;
    }
    
    // 3. Index session start times by customer_id
    // We don't need to filter by range here, as step 4 handles matching the time relative to the order.
    const sessionsByCustomer = allSessions.reduce((acc, session) => {
        if (!session.customer_id) return acc;
        if (!acc.has(session.customer_id)) {
            // Because we fetched the data sorted DESC, the array will be sorted from 
            // most recent session to oldest session for that customer.
            acc.set(session.customer_id, []);
        }
        // Store the object { ms: milliseconds, created_at: string }
        acc.get(session.customer_id)?.push({
            ms: new Date(session.created_at).getTime(),
            created_at: session.created_at,
        });
        return acc;
    }, new Map<string, Array<{ ms: number, created_at: string }>>());

    let totalThroughputTime = 0;
    let calculatedOrdersCount = 0;

    // 4. Client-side matching and calculation
    for (const order of orders) {
        if (!order.customer_id) continue;
        
        const orderTimeMs = new Date(order.created_at).getTime();
        const customerSessionTimes = sessionsByCustomer.get(order.customer_id);

        if (!customerSessionTimes) continue;

        let latestSession: { ms: number, created_at: string } | null = null;
        
        // Find the LATEST session time that is LESS than the order time
        // Because the array is sorted DESC (most recent first), the first session 
        // we find that is BEFORE the order is the correct LATEST touchpoint.
        for (const session of customerSessionTimes) {
            if (session.ms < orderTimeMs) {
                latestSession = session; 
                break; // Stop looking, this is the LATEST
            }
        }

        if (latestSession !== null) {
            const durationSeconds = (orderTimeMs - latestSession.ms) / 1000;

            // --- CRITICAL DEBUGGING LOGS ---
            // These logs will help you confirm the fix is working by showing the selected duration
            if (calculatedOrdersCount < 5) { // Log the first few successful calculations
                console.log(`[KPI 5 FALLBACK DEBUG] Order ID: ${order.order_id}`);
                console.log(`[KPI 5 FALLBACK DEBUG] 1. Order Time: ${order.created_at}`);
                console.log(`[KPI 5 FALLBACK DEBUG] 2. Matched Session Start Time (Latest): ${latestSession.created_at}`);
                console.log(`[KPI 5 FALLBACK DEBUG] 3. Calculated Duration: ${durationSeconds.toFixed(2)} seconds`);
            }
            // --- END CRITICAL DEBUGGING LOGS ---

            totalThroughputTime += durationSeconds;
            calculatedOrdersCount++;
        }
    }

    if (calculatedOrdersCount === 0) return null;
    return { time: totalThroughputTime, count: calculatedOrdersCount };
}

export async function getAverageServiceRequestThroughputTime(range: DateRange): Promise<number | null> {
  console.log(`[KPI 5] Fetching Avg SRTT for range: ${range.startDate} to ${range.endDate}`);

  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // PRIMARY LOGIC: Quote-Linked
  const primaryResult = await calculateSrttByQuoteLinkage(range, exclusiveEndDate);
  
  if (primaryResult) {
      console.log(`[KPI 5 DEBUG] Primary (Quote-Linked) SRTT calculated using ${primaryResult.count} orders.`);
      return primaryResult.time / primaryResult.count;
  }
  
  // FALLBACK LOGIC: Customer-Linked
  const fallbackResult = await calculateSrttByCustomerLinkage(range, exclusiveEndDate);

  if (fallbackResult) {
      console.log(`[KPI 5 DEBUG] Fallback (Customer-Linked) SRTT calculated using ${fallbackResult.count} orders.`);
      return fallbackResult.time / fallbackResult.count;
  }

  console.warn('[KPI 5 WARNING] Could not calculate SRTT using either Primary (Quote-Linked) or Fallback (Customer-Linked) logic.');
  return null;
}


// --- KPI 6: Percentage of Service Requests Initiated via PRINTY ---

/**
 * Primary Logic: Orders linked directly to a quote ID generated within a chat session.
 */
async function getOrdersSourcedFromChatByQuoteLinkage(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
    // 1. Get all unique quote_ids generated by chat sessions
    const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions_v2')
        .select('quote_id')
        .not('quote_id', 'is', null)
        .gte('created_at', range.startDate)
        .lt('created_at', exclusiveEndDate);

    if (sessionError || !sessions) return null;

    const quotedInChatIds = Array.from(new Set(sessions.map(s => s.quote_id).filter((id): id is string => id !== null)));
    
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
async function getOrdersSourcedFromChatByCustomerLinkage(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
    console.warn('[KPI 6 FALLBACK] Falling back to less precise Customer-Linked Sourced Orders calculation.');
    
    // 1. Get all unique customer IDs that started a chat session in the range
    const { data: chatCustomers, error: chatError } = await supabase
        .from('chat_sessions_v2')
        .select('customer_id')
        .not('customer_id', 'is', null)
        .gte('created_at', range.startDate)
        .lt('created_at', exclusiveEndDate);

    if (chatError || !chatCustomers || chatCustomers.length === 0) return 0;

    const chattingCustomerIds = Array.from(new Set(chatCustomers.map(c => c.customer_id)));
    
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

export async function getOrdersSourcedFromChatRate(range: DateRange, ordersFromOtherChannels: number): Promise<number | null> {
  console.log(`[KPI 6] Fetching Chat Sourced Orders Rate for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);

  // PRIMARY LOGIC: Quote-Linked
  let totalOrdersViaPrinty = await getOrdersSourcedFromChatByQuoteLinkage(range, exclusiveEndDate);

  if (totalOrdersViaPrinty === null || totalOrdersViaPrinty === 0) {
      // FALLBACK LOGIC: Customer-Linked
      totalOrdersViaPrinty = await getOrdersSourcedFromChatByCustomerLinkage(range, exclusiveEndDate);
      if (totalOrdersViaPrinty === null) return null; 
  } else {
      console.log(`[KPI 6 DEBUG] Primary (Quote-Linked) Sourced Orders: ${totalOrdersViaPrinty}`);
  }
  
  const totalAllRequests = totalOrdersViaPrinty + ordersFromOtherChannels;

  if (totalAllRequests === 0) return 0;
  
  return (totalOrdersViaPrinty / totalAllRequests) * 100;
}

// --- KPI 7: Job Order Accuracy Rate (JOAR) ---
export async function getJobOrderAccuracyRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 7] Fetching JOAR for range: ${range.startDate} to ${range.endDate}`);
  
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
async function getRawOrderStatusInquiryTriggersByInquiryId(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
  // Primary Logic: Count unique inquiry_ids
  const { data: inquirySessions, error: dataError } = await supabase
    .from('chat_sessions_v2')
    .select('inquiry_id')
    .in('flow_id', ORDER_STATUS_INQUIRY_FLOW_IDS)
    .not('inquiry_id', 'is', null) // Only count if a related inquiry_id was generated
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (dataError || !inquirySessions) return null;
  
  const uniqueInquiryIds = Array.from(new Set(inquirySessions.map(s => s.inquiry_id)));
  
  return uniqueInquiryIds.length;
}

async function getRawOrderStatusInquiryTriggersByFlowId(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
    console.warn('[KPI 8 FALLBACK] Falling back to less precise Flow-ID Inquiries calculation (may overcount).');
    
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

export async function getOrderStatusInquiryRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 8] Fetching Order Status Inquiry Rate for range: ${range.startDate} to ${range.endDate}`);

  const exclusiveEndDate = getNextDayString(range.endDate);

  // PRIMARY LOGIC: Unique Inquiry ID
  let totalInquiries = await getRawOrderStatusInquiryTriggersByInquiryId(range, exclusiveEndDate);
  
  if (totalInquiries === null || totalInquiries === 0) {
      // FALLBACK LOGIC: Flow ID Count
      totalInquiries = await getRawOrderStatusInquiryTriggersByFlowId(range, exclusiveEndDate);
      if (totalInquiries === null) return null;
  } else {
      console.log(`[KPI 8 DEBUG] Primary (Inquiry-ID) Inquiries Counted: ${totalInquiries}`);
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
export async function getUpToDateServicePortfolioRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 9] Fetching Portfolio Rate for range: ${range.startDate} to ${range.endDate}`);
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  const { count: totalServices, error: totalError } = await supabase
    .from('printing_services')
    .select('service_id', { count: 'exact', head: true }); 

  if (totalError || totalServices === null || totalServices === 0) return 0;

  const { count: updatedServices, error: updatedError } = await supabase
    .from('printing_services')
    .select('service_id', { count: 'exact', head: true })
    .gte('date_last_modified', range.startDate) 
    .lt('date_last_modified', exclusiveEndDate);

  if (updatedError || updatedServices === null) return 0;

  return (updatedServices / totalServices) * 100;
}

// --- KPI 10: Service Portfolio Utilization Rate (SPUR) ---
export async function getServicePortfolioUtilizationRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 10] Fetching SPUR for range: ${range.startDate} to ${range.endDate}`);
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
