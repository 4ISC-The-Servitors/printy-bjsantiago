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
console.log(`URL Check: ${supabaseUrl ? 'OK' : 'MISSING'}`);
console.log(`Key Check: ${supabaseAnonKey ? 'OK' : 'MISSING'}`);
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing. Connection will likely fail.');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized.');
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
 * This is crucial for correctly implementing an exclusive end date (LT - Less Than)
 * in Supabase queries to cover the entire last day of the range (up to 23:59:59.999...).
 * @param dateString - Date in 'YYYY-MM-DD' format.
 * @returns Date string for the next day in 'YYYY-MM-DD' format.
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
    // NOTE: This logic handles the high-precision timestamp format from PostgreSQL (timestamptz)
    // 1. Get the standard millisecond value from the date object.
    const date = new Date(timestamp);
    let ms = date.getTime();

    // 2. Extract the microsecond part manually.
    const microsecondMatch = timestamp.match(/\.(\d{3})(\d{3})/);

    if (microsecondMatch) {
        const microsecondRemainder = parseInt(microsecondMatch[2], 10);
        const msFraction = microsecondRemainder / 1000;
        ms += msFraction;
    }
    return ms;
}


/**
 * * --- DIAGNOSTIC UTILITY ---
 * * Diagnostic function to check if ANY data exists in a table, regardless of date.
 * Use this to verify RLS settings and table names if your KPIs return 0 results.
 */
export async function checkDataExistence(tableName: 'chat_sessions_v2' | 'orders' | 'printing_services'): Promise<number | null> {
  console.log(`[DIAGNOSTIC] Checking existence in table: ${tableName}`);
  // Using select('*') with head: true and limit: 1 is the fastest way to check existence and count.
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .limit(1);

  if (error) {
    console.error(`[DIAGNOSTIC ERROR] Failed to fetch count from ${tableName}. Check RLS or table name:`, error.message);
    return null;
  }
  return count;
}


/**
 * 1. Chatbot First-Contact Resolution Rate (FCR) KPI - REFINED LOGIC
 */
export async function getFirstContactResolutionRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 1] Fetching FCR Rate for range: ${range.startDate} to ${range.endDate}`);

  const exclusiveEndDate = getNextDayString(range.endDate);

  // 1. Denominator: Get the total number of sessions in the specified range.
  const { count: totalSessions, error: countError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate); 

  console.log(`[KPI 1 DEBUG] Total Sessions (Denominator): ${totalSessions}`);

  if (countError || totalSessions === null) {
    console.error('[KPI 1 ERROR] Failed to fetch total sessions (Denominator). Check RLS on chat_sessions.');
    console.error(countError);
    return null;
  }
  
  if (totalSessions === 0) {
      console.warn('[KPI 1 WARNING] No total chat sessions found in the range.');
      return 0;
  }

  // 2. Find all unique session IDs that triggered an escalation flow in the reporting period
  const { data: escalatedFlows, error: flowError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .in('flow_id', ESCALATION_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (flowError || !escalatedFlows) {
    console.error('[KPI 1 ERROR] Failed to fetch escalation flows for exclusion. Error details:', JSON.stringify(flowError));
    return null; 
  }

  // Get unique session IDs that escalated
  const escalatedSessionIds = Array.from(new Set(escalatedFlows.map(f => f.session_id)));
  console.log(`[KPI 1 DEBUG] Number of sessions that escalated (to be EXCLUDED): ${escalatedSessionIds.length}.`);

  // 3. Numerator Part A: Get ALL sessions that ended within the range (candidates for FCR)
  const { data: endedSessions, error: endedSessionsError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .eq('status', 'ended')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (endedSessionsError || !endedSessions) {
    console.error('[KPI 1 ERROR] Failed to fetch ALL ended sessions (Numerator Part A). Check RLS on chat_sessions.');
    console.error('Ended Sessions Error Details:', JSON.stringify(endedSessionsError)); 
    return null;
  }
  
  // 4. Numerator Part B: Client-side filtering to exclude escalated sessions.
  const escalatedSet = new Set(escalatedSessionIds);
  const nonEscalatedResolvedSessions = endedSessions.filter(session => 
    !escalatedSet.has(session.session_id)
  );

  const resolvedByPrinty = nonEscalatedResolvedSessions.length;
  console.log(`[KPI 1 DEBUG] FCR Numerator (Resolved Sessions): ${resolvedByPrinty}.`);


  // 5. Calculate the First Contact Resolution Rate
  // The logic here is mathematically: (Total Ended - Escalated) / Total Started
  return (resolvedByPrinty / totalSessions) * 100;
}


/**
 * 2. Average Response Time for Initial Inquiry
 */
export async function getAverageInitialResponseTime(range: DateRange): Promise<number | null> {
  console.log(`[KPI 2] Fetching Avg Initial Response Time for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // 1. Get all session_ids in range
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessionError || !sessions || sessions.length === 0) {
      console.warn('[KPI 2 WARNING] No sessions found in the date range.');
      return null;
  }

  const sessionIds = sessions.map(s => s.session_id);
  
  // --- KPI 2 TRACKER ADDED HERE ---
  console.log(`[KPI 2 DEBUG] Total Sessions Retrieved for Range: ${sessionIds.length}`);
  // --------------------------------

  // 2. REFACTOR: Fetch all messages and metas in one go using the join syntax.
  const { data: combinedMessages, error: combinedError } = await supabase
    .from('chat_messages_v2')
    .select(`
      session_id,
      sent_at,
      sender_role,
      metadata
    `)
    .in('session_id', sessionIds)
    .order('sent_at', { ascending: true }); // Ensure messages are chronologically ordered

  if (combinedError || !combinedMessages || combinedMessages.length === 0) {
      console.warn('[KPI 2 WARNING] No combined message data found.');
      return null;
  }

  // Process combined data to group by session_id
  const groupedMessages = combinedMessages.reduce((acc, msg) => {
    // In v2, sender_role is directly on the message
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

  // 3. Calculate the response time for each session
  for (const sessionMessages of groupedMessages.values()) {
    const sessionId = sessionMessages[0].session_id; // Get session ID for logging
    let customerMsgTime: number | null = null;
    let printyMsgTime: number | null = null;
    let customerSentAt: string = '';
    let printySentAt: string = '';

    for (const msg of sessionMessages) {
        // 3a. Find the first customer message (the start time)
        if (msg.sender_role === 'customer' && customerMsgTime === null) {
            customerMsgTime = parseTimestampToMilliseconds(msg.sent_at);
            customerSentAt = msg.sent_at; // Capture original timestamp string
        } 
        
        // 3b. Find the first Printy reply after the customer message (the end time)
        // Ensure Printy's reply happened *after* the customer's first message
        else if (msg.sender_role === 'printy' && customerMsgTime !== null) {
            printyMsgTime = parseTimestampToMilliseconds(msg.sent_at);
            
            // Critical check: Ensure Printy's message is truly *after* the customer's message
            if (printyMsgTime > customerMsgTime) { 
                printySentAt = msg.sent_at; // Capture original timestamp string
                break; // Found the response, move to the next session
            }
            // If Printy's first message is *before* the customer's (e.g., initial welcome), continue search
        }
    }

    // 4. Aggregate the time difference or log why the session was skipped
    if (customerMsgTime !== null && printyMsgTime !== null) {
        const timeDifferenceMs = printyMsgTime - customerMsgTime;
        
        // --- KPI 2 Session Debugger (Individual Calculation) ---
        // console.log(`[KPI 2 Session: ${sessionId}]`);
        // console.log(` -> Start (Customer): ${customerSentAt} -> ${customerMsgTime.toFixed(3)}ms`);
        // console.log(` -> End (Printy): ${printySentAt} -> ${printyMsgTime.toFixed(3)}ms`);
        // console.log(` -> Difference: ${(timeDifferenceMs / 1000).toFixed(4)}s`);
        // ------------------------------
        
        totalResponseTime += timeDifferenceMs / 1000; 
        count++;
    } else {
        // --- KPI 2 Skipped Session Debugger ---
        // if (customerMsgTime === null) {
        //     console.warn(`[KPI 2 Session: ${sessionId}] SKIPPED: No initial customer message found. (Likely flow-only session)`);
        // } else { // customerMsgTime is NOT null, but printyMsgTime IS null
        //     console.warn(`[KPI 2 Session: ${sessionId}] SKIPPED: Customer message found, but no subsequent Printy reply found. (Likely last message)`);
        // }
        // ------------------------------
    }
  }

  if (count === 0) {
      console.warn('[KPI 2 WARNING] Could not calculate response time for any session (e.g., no customer message followed by printy reply).');
      return null;
  }
  
  // --- KPI 2 Final Debugger ---
  console.log(`[KPI 2 DEBUG] Final Aggregation: Total Response Time = ${totalResponseTime.toFixed(4)}s, Count = ${count}`);
  // ----------------------------
  
  return totalResponseTime / count;
}


/**
 * 3. Customer Satisfaction Score (CSAT) for PRINTY
 * NOTE: This KPI is currently non-functional and returning 0 because the 'feedback_rating'
 * column is missing from the provided 'chat_sessions_v2' schema.
 */
export async function getAverageCustomerSatisfactionScore(range: DateRange): Promise<number | null> {
  console.log(`[KPI 3] Fetching Avg CSAT for range: ${range.startDate} to ${range.endDate}`);
  console.warn('[KPI 3 WARNING] CSAT calculation is currently disabled/non-functional because the feedback column is missing from the chat_sessions_v2 table. Returning 0.');
  // Placeholder return as per user request to ignore temporarily
  return 0;
}


/**
 * 4. Escalation Rate KPI 
 */
export async function getEscalationRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 4] Fetching Escalation Rate for range: ${range.startDate} to ${range.endDate}`);

  const exclusiveEndDate = getNextDayString(range.endDate);

  // 1. Denominator: Get the total number of sessions in the specified range.
  const { count: totalSessions, error: countError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate); 

  if (countError || totalSessions === null) {
    console.error('[KPI 4 ERROR] Failed to fetch total sessions (Denominator). Check RLS on chat_sessions.');
    console.error(countError);
    return null;
  }
  
  if (totalSessions === 0) {
      console.warn('[KPI 4 WARNING] No total chat sessions found in the range.');
      return 0;
  }

  // 2. Numerator: Find all unique session IDs that triggered an escalation flow in the reporting period
  const { data: escalatedFlows, error: flowError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .in('flow_id', ESCALATION_FLOW_IDS) // *** USING GLOBAL CONSTANT ***
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (flowError || !escalatedFlows) {
    console.error('[KPI 4 ERROR] Failed to fetch escalation flows. Error details:', JSON.stringify(flowError));
    return null; 
  }

  // Get unique session IDs that escalated (the numerator)
  const escalatedSessionIds = Array.from(new Set(escalatedFlows.map(f => f.session_id)));
  const totalEscalated = escalatedSessionIds.length;
  
  console.log(`[KPI 4 DEBUG] Total Sessions (Denominator): ${totalSessions}, Total Escalated (Numerator): ${totalEscalated}`);

  // 3. Calculate the Escalation Rate
  return (totalEscalated / totalSessions) * 100;
}


/**
 * 5. Average Service Request Throughput Time (SRTT)
 * **UPDATED**: Using 'created_at' for the order timestamp.
 */
export async function getAverageServiceRequestThroughputTime(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);
  console.log(`[KPI 5] Fetching Avg SRTT for range: ${range.startDate} to ${range.endDate}`);

  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('order_id, customer_id, created_at') // <<< UPDATED to use created_at
    .gte('created_at', range.startDate) // <<< UPDATED to use created_at
    .lt('created_at', exclusiveEndDate); // <<< UPDATED to use created_at

  if (orderError || !orders || orders.length === 0) {
    console.warn('[KPI 5 WARNING] No orders found in the date range.');
    return null;
  }

  const customerIds = Array.from(new Set(orders.map(o => o.customer_id)));
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id, customer_id, created_at')
    .in('customer_id', customerIds);

  if (sessionError || !sessions) {
    console.error('[KPI 5 ERROR] Failed to fetch relevant sessions.');
    return null;
  }

  const sessionIds = sessions.map(s => s.session_id);
  const { data: messages, error: messageError } = await supabase
    .from('chat_messages_v2')
    .select('session_id, sent_at')
    .in('session_id', sessionIds);

  if (messageError || !messages) {
    console.error('[KPI 5 ERROR] Failed to fetch relevant messages.');
    return null;
  }

  let totalThroughputTime = 0;
  let calculatedOrdersCount = 0;

  for (const order of orders) {
    // Find sessions for this customer before order
    const relevantSessions = sessions.filter(
      // <<< UPDATED to use created_at for order comparison
      s => s.customer_id === order.customer_id && s.created_at <= order.created_at
    );
    if (relevantSessions.length === 0) continue;
    const relevantSessionIds = relevantSessions.map(s => s.session_id);

    // Find latest message before order
    const relevantMessages = messages.filter(
      // <<< UPDATED to use created_at for order comparison
      m => relevantSessionIds.includes(m.session_id) && m.sent_at < order.created_at
    );
    if (relevantMessages.length === 0) continue;
    
    // Find the latest message *before* the order was created
    const latestMessage = relevantMessages.reduce((latest, msg) =>
      new Date(msg.sent_at) > new Date(latest.sent_at) ? msg : latest
    );

    const messageTime = new Date(latestMessage.sent_at).getTime();
    // <<< UPDATED to use created_at for order comparison
    const orderTime = new Date(order.created_at).getTime(); 
    totalThroughputTime += (orderTime - messageTime) / 1000;
    calculatedOrdersCount++;
  }

  if (calculatedOrdersCount === 0) return null;
  return totalThroughputTime / calculatedOrdersCount;
}


/**
 * 6. Percentage of Service Requests Initiated via PRINTY
 * **UPDATED**: Using 'created_at' for the order timestamp.
 */
export async function getOrdersSourcedFromChatRate(range: DateRange, ordersFromOtherChannels: number): Promise<number | null> {
  console.log(`[KPI 6] Fetching Chat Sourced Orders Rate for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // 1. Get the distinct customer IDs from chat sessions in the date range.
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('customer_id')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessionError || !sessions) {
    console.error('[KPI 6 ERROR] Failed to fetch sessions for customer IDs. Check RLS on chat_sessions.');
    console.error(sessionError);
    return null;
  }

  const chattedCustomerIds = new Set(sessions.map(s => s.customer_id).filter(id => id !== null));
  if (chattedCustomerIds.size === 0) {
    if (ordersFromOtherChannels === 0) return 0;
    return 0; // If no chat orders, rate is 0%.
  }

  // 2. Count orders placed by these chatted customers in the date range (Total Requests via PRINTY).
  const { count: totalOrdersViaPrinty, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .in('customer_id', Array.from(chattedCustomerIds))
    .gte('created_at', range.startDate) // <<< UPDATED to use created_at
    .lt('created_at', exclusiveEndDate); // <<< UPDATED to use created_at

  if (orderError || totalOrdersViaPrinty === null) {
    console.error('[KPI 6 ERROR] Failed to fetch orders via PRINTY. Check RLS on orders.');
    console.error(orderError);
    return null;
  }

  // 3. Calculate the total requests from all channels (Denominator).
  const totalAllRequests = totalOrdersViaPrinty + ordersFromOtherChannels;

  if (totalAllRequests === 0) return 0;

  // 4. Calculate the Rate.
  return (totalOrdersViaPrinty / totalAllRequests) * 100;
}


/**
 * 7. Job Order Accuracy Rate (Service Request)
 * **UPDATED**: Using 'created_at' and 'status' columns.
 */
export async function getJobOrderAccuracyRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 7] Fetching JOAR for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // 1. Get the total number of orders created within the specified date range (Denominator).
  const { count: totalOrders, error: totalOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate) // <<< UPDATED to use created_at
    .lt('created_at', exclusiveEndDate); // <<< UPDATED to use created_at

  if (totalOrdersError || totalOrders === null) {
    console.error('[KPI 7 ERROR] Failed to fetch total orders (Denominator). Check RLS on orders.');
    console.error(totalOrdersError);
    return null;
  }

  if (totalOrders === 0) return 0;

  // 2. Get the number of orders that were *not* cancelled (Numerator).
  const { count: accurateOrders, error: accurateOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate) // <<< UPDATED to use created_at
    .lt('created_at', exclusiveEndDate) // <<< UPDATED to use created_at
    .neq('status', 'cancelled'); // <<< UPDATED to use 'status' column

  if (accurateOrdersError || accurateOrders === null) {
    console.error('[KPI 7 ERROR] Failed to fetch non-cancelled orders (Numerator). Check RLS on orders.');
    console.error(accurateOrdersError);
    return null;
  }

  const totalNonCancelledOrders = accurateOrders;

  // 3. Calculate the Job Order Accuracy Rate
  return (totalNonCancelledOrders / totalOrders) * 100;
}


/**
 * Helper function to get the raw count of order status inquiry flows.
 */
async function getRawOrderStatusInquiryTriggers(range: DateRange): Promise<number | null> {
  console.log(`[KPI 8 Helper] Counting Inquiry Triggers for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // Count entries in chat_sessions_v2 that match the dedicated status inquiry flows
  const { count: inquiryCount, error: countError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .in('flow_id', ORDER_STATUS_INQUIRY_FLOW_IDS)
    .gte('created_at', range.startDate) // Filter by flow start time
    .lt('created_at', exclusiveEndDate);

  if (countError || inquiryCount === null) {
    console.error('[KPI 8 ERROR] Failed to count order status inquiry triggers. Check RLS on chat_sessions_v2.');
    console.error(countError);
    return null;
  }
  return inquiryCount;
}

/**
 * 8. Order Status Inquiry Rate via PRINTY
 * **UPDATED**: Using 'created_at' for the order timestamp.
 */
export async function getOrderStatusInquiryRate(range: DateRange): Promise<number | null> {
  // 1. Get the raw count of status inquiries (Numerator)
  const totalInquiries = await getRawOrderStatusInquiryTriggers(range);
  if (totalInquiries === null) return null;
  console.log(`[KPI 8] Total Inquiries Counted: ${totalInquiries}`);

  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // 2. Get the total number of orders created (Denominator).
  const { count: totalOrders, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate) // <<< UPDATED to use created_at
    .lt('created_at', exclusiveEndDate); // <<< UPDATED to use created_at

  if (orderError || totalOrders === null) {
    console.error('[KPI 8 ERROR] Failed to fetch total orders (Denominator). Check RLS on orders.');
    console.error(orderError);
    return null;
  }

  if (totalOrders === 0) {
    // If no orders were placed, the rate cannot be calculated, or is effectively 0 if no inquiries were made.
    return totalInquiries > 0 ? null : 0;
  }

  // 3. Calculate the Order Status Inquiry Rate (Inquiries per Order)
  return totalInquiries / totalOrders;
}


/**
 * 9. Up-to-date Service Portfolio Rate
 * NOTE: The column name 'date_last_modified' was already correct.
 */
export async function getUpToDateServicePortfolioRate(range: DateRange): Promise<number | null> {
  // CORRECTED: Using 'printing_services' table and 'date_last_modified' column
  console.log(`[KPI 9] Fetching Portfolio Rate for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // 1. Get the total number of services in the portfolio (Denominator).
  const { count: totalServices, error: totalError } = await supabase
    .from('printing_services') // Corrected table name
    .select('service_id', { count: 'exact', head: true }); 

  if (totalError || totalServices === null || totalServices === 0) {
    console.error('[KPI 9 ERROR] Failed to fetch total services (Denominator). Check RLS on printing_services.');
    console.error('Total Services Error Details:', JSON.stringify(totalError));
    return 0;
  }

  // 2. Get the count of services that were updated within the defined range (Numerator).
  const { count: updatedServices, error: updatedError } = await supabase
    .from('printing_services') // Corrected table name
    .select('service_id', { count: 'exact', head: true })
    .gte('date_last_modified', range.startDate) 
    .lt('date_last_modified', exclusiveEndDate);

  if (updatedError || updatedServices === null) {
    console.error('[KPI 9 ERROR] Failed to fetch updated services (Numerator). Check RLS on printing_services.');
    console.error('Updated Services Error Details:', JSON.stringify(updatedError));
    return 0;
  }

  // 3. Calculate the Rate: (Updated Services / Total Services) * 100
  return (updatedServices / totalServices) * 100;
}


/**
 * 10. Service Portfolio Utilization Rate (SPUR)
 * **UPDATED**: Using 'created_at' for the order timestamp.
 */
export async function getServicePortfolioUtilizationRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 10] Fetching SPUR for range: ${range.startDate} to ${range.endDate}`);
  
  const exclusiveEndDate = getNextDayString(range.endDate);
  
  // 1. Get the total number of chat sessions started (Denominator).
  const { count: totalSessions, error: sessionError } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessionError || totalSessions === null) {
    console.error('[KPI 10 ERROR] Failed to fetch total sessions (Denominator). Check RLS on chat_sessions.');
    console.error(sessionError);
    return null;
  }

  if (totalSessions === 0) return 0;

  // 2. Get the total number of orders created (Numerator).
  const { count: totalOrders, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate) // <<< UPDATED to use created_at
    .lt('created_at', exclusiveEndDate); // <<< UPDATED to use created_at

  if (orderError || totalOrders === null) {
    console.error('[KPI 10 ERROR] Failed to fetch total orders (Numerator). Check RLS on orders.');
    console.error(orderError);
    return null;
  }

  const totalOrdersCreated = totalOrders;

  // 3. Calculate the Service Portfolio Utilization Rate
  return (totalOrdersCreated / totalSessions) * 100;
}
