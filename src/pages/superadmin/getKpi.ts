import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- DEBUG INITIALIZATION ---
console.log('--- Supabase Client Initialization ---');
console.log(`URL Check: ${supabaseUrl ? 'OK' : 'MISSING'}`);
console.log(`Key Check: ${supabaseAnonKey ? 'OK' : 'MISSING'}`);
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing. Connection will likely fail.');
}
// FIX: Corrected initialization to use supabaseUrl instead of passing the uninitialized 'supabase' object.
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized.');
// ----------------------------


/**
 * ASSUMPTION: This constant must match the specific flow_id used in the
 * 'chat_session_flow' table that corresponds to the customer initiating an
 * order or ticket status check (e.g., "Track Order" or "Check Ticket Status").
 */
const ORDER_STATUS_FLOW_ID = 'issue-ticket'; 

/**
 * Interface for standard date range filtering.
 * Dates should be provided in a valid string format (e.g., 'YYYY-MM-DD' or ISO 8601).
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

// --- KPI Functions ordered 1-10 ---

/**
 * Helper function to parse a PostgreSQL timestamp string (which includes up to 6 digits for microseconds)
 * into a floating-point number representing milliseconds since the Unix epoch.
 * This is necessary because JS Date objects often truncate or round microsecond data.
 */
function parseTimestampToMilliseconds(timestamp: string): number {
    // 1. Get the standard millisecond value from the date object.
    const date = new Date(timestamp);
    let ms = date.getTime();

    // 2. Extract the microsecond part manually.
    const microsecondMatch = timestamp.match(/\.(\d{3})(\d{3})/); // Matches .XXX,XXX where X are digits

    if (microsecondMatch) {
        // The first 3 digits (e.g., 075 in .075487) are generally handled by new Date() as milliseconds.
        // We focus on the second 3 digits (e.g., 487 in .075487) which represent the microsecond remainder.
        const microsecondRemainder = parseInt(microsecondMatch[2], 10);
        
        // Convert the microsecond remainder (1 microsecond = 0.001 milliseconds) to a millisecond fraction.
        const msFraction = microsecondRemainder / 1000;
        
        // Add the fraction to the total milliseconds for higher precision.
        ms += msFraction;
    }
    return ms;
}


/**
 * 1. Chatbot First-Contact Resolution Rate (FCR) KPI
 * Percentage of sessions where the chatbot resolved the user's inquiry without
 * requiring transfer to a human agent, and the session was marked as 'ended'.
 * Formula: (Total Resolved Sessions by PRINTY / Total Sessions) * 100
 */
export async function getFirstContactResolutionRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 1] Fetching FCR Rate for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Get the total number of sessions in the specified range (the denominator).
  const { count: totalSessions, error: countError } = await supabase
    .from('chat_sessions')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (countError || totalSessions === null) {
    console.error('[KPI 1 ERROR] Failed to fetch total sessions (Denominator). Check RLS on chat_sessions.');
    console.error(countError);
    return null;
  }
  if (totalSessions === 0) return 0;

  // 2. Get the number of sessions that meet the criteria for FCR within the range:
  const { count: resolvedSessions, error: resolvedError } = await supabase
    .from('chat_sessions')
    .select('session_id', { count: 'exact', head: true })
    .is('inquiry_id', null)
    .eq('status', 'ended')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (resolvedError || resolvedSessions === null) {
    console.error('[KPI 1 ERROR] Failed to fetch resolved sessions (Numerator). Check RLS on chat_sessions.');
    console.error(resolvedError);
    return null;
  }

  const totalResolvedByPrinty = resolvedSessions;

  // 3. Calculate the First Contact Resolution Rate
  return (totalResolvedByPrinty / totalSessions) * 100;
}


/**
 * 2. Average Response Time for Initial Inquiry
 * Computes the average response time (in seconds) from customer initial message to PRINTY's first reply,
 * only for sessions within the specified date range.
 */
export async function getAverageInitialResponseTime(range: DateRange): Promise<number | null> {
  console.log(`[KPI 2] Fetching Avg Initial Response Time for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Get all session_ids in range
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (sessionError || !sessions || sessions.length === 0) {
      console.warn('[KPI 2 WARNING] No sessions found in the date range.');
      return null;
  }

  const sessionIds = sessions.map(s => s.session_id);

  // 2. Fetch all messages and metas and combine them for efficient in-memory processing.
  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('message_id, session_id, sent_at')
    .in('session_id', sessionIds)
    .order('sent_at', { ascending: true }); // Ensure messages are chronologically ordered

  if (msgError || !messages || messages.length === 0) return null;

  const messageIds = messages.map(m => m.message_id);
  const { data: metas, error: metaError } = await supabase
    .from('chat_message_meta')
    .select('message_id, sender_role')
    .in('message_id', messageIds);

  if (metaError || !metas || metas.length === 0) return null;

  // Create a map for quick lookup of sender_role by message_id
  const metaMap = new Map(metas.map(meta => [meta.message_id, meta.sender_role]));

  // Combine messages with roles and group by session_id
  const groupedMessages = messages.reduce((acc, msg) => {
    const sender_role = metaMap.get(msg.message_id);
    if (!sender_role) return acc; // Skip messages without a role

    const messageWithRole = {
      session_id: msg.session_id,
      sent_at: msg.sent_at,
      sender_role: sender_role,
    };

    if (!acc.has(msg.session_id)) {
      acc.set(msg.session_id, []);
    }
    // The messages array is globally ordered, which maintains chronological order within each session group
    acc.get(msg.session_id)?.push(messageWithRole);
    return acc;
  }, new Map<string, Array<{ session_id: string, sent_at: string, sender_role: string }>>());

  let totalResponseTime = 0;
  let count = 0;

  // 3. Calculate the response time for each session
  for (const sessionMessages of groupedMessages.values()) {
    let customerMsgTime: number | null = null;
    let printyMsgTime: number | null = null;

    for (const msg of sessionMessages) {
        // 3a. Find the first customer message (the start time)
        if (msg.sender_role === 'customer' && customerMsgTime === null) {
            // Use the microsecond-aware parser
            customerMsgTime = parseTimestampToMilliseconds(msg.sent_at);
        } 
        
        // 3b. Find the first Printy reply after the customer message (the end time)
        else if (msg.sender_role === 'printy' && customerMsgTime !== null) {
            // Use the microsecond-aware parser
            printyMsgTime = parseTimestampToMilliseconds(msg.sent_at);
            break; // Found the response, move to the next session
        }
    }

    // 4. Aggregate the time difference
    if (customerMsgTime !== null && printyMsgTime !== null) {
        // timeDifferenceMs is in milliseconds (now with microsecond precision)
        const timeDifferenceMs = printyMsgTime - customerMsgTime;
        
        // Convert to seconds and add to total.
        totalResponseTime += timeDifferenceMs / 1000; 
        count++;
    }
  }

  if (count === 0) {
      console.warn('[KPI 2 WARNING] Could not calculate response time for any session (e.g., no customer message followed by printy reply).');
      return null;
  }
  return totalResponseTime / count;
}


/**
 * 3. Customer Satisfaction Score (CSAT) for PRINTY
 * Computes the average feedback_rating for sessions within a specified date range.
 * Formula: Average(feedback_rating) on filtered chat_sessions.
 */
export async function getAverageCustomerSatisfactionScore(range: DateRange): Promise<number | null> {
  console.log(`[KPI 3] Fetching Avg CSAT for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Use the PostgREST aggregate function string directly in the select statement
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('avg(feedback_rating)') 
    // Filter to only include sessions within the specified date range
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate)
    // Exclude sessions where the feedback_rating is null (unrated sessions)
    .not('feedback_rating', 'is', null)
    .single(); // Use .single() to fetch the one expected row of aggregation data

  if (error || !data) {
    console.error('[KPI 3 ERROR] Failed to fetch average CSAT. Check RLS on chat_sessions.');
    console.error(error); // Log the detailed Supabase error object
    return null;
  }

  // --- FIX FOR TYPESCRIPT ERROR ---
  // The data structure from 'avg(column)' is always a single object like { "avg": "value" }.
  // We first cast the result to 'unknown' and then assert its correct type to satisfy TS.
  const averageRatingResult = (data as unknown as { avg: string | null }).avg;
  // --- END FIX ---
  
  // Check if the aggregation result is null, which happens if NO sessions were rated
  if (averageRatingResult === null || averageRatingResult === undefined) {
    console.warn('[KPI 3 WARNING] No rated sessions found for the given range, returning null.');
    return null; 
  }
  
  // Supabase returns the avg as a string; parse it to a float.
  return parseFloat(averageRatingResult);
}


/**
 * 4. Escalation Rate KPI
 * Percentage of PRINTY interactions that require escalation to a human administrator,
 * calculated only for sessions within the specified date range.
 * Formula: (total inquiries transferred to admin / total inquiries handled by PRINTY) * 100
 */
export async function getEscalationRate(range: DateRange): Promise<number | null> {
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id, inquiry_id')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (sessionError || !sessions) return null;

  const totalHandled = sessions.length;
  const inquiryIds = sessions.map(s => s.inquiry_id).filter(Boolean);

  if (totalHandled === 0) return 0;
  if (inquiryIds.length === 0) return 0;

  // Batch fetch inquiries
  const { data: inquiries, error: inquiryError } = await supabase
    .from('inquiries')
    .select('inquiry_id')
    .in('inquiry_id', inquiryIds);

  if (inquiryError || !inquiries) return null;

  const totalTransferred = inquiries.length;
  return (totalTransferred / totalHandled) * 100;
}


/**
 * 5. Average Service Request Throughput Time (SRTT)
 * Description: Average time elapsed (in seconds) from the customer's last message *before* placing an order
 * to the moment the corresponding job order is created in the 'orders' table.
 */
export async function getAverageServiceRequestThroughputTime(range: DateRange): Promise<number | null> {
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('order_id, customer_id, order_datetime')
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

  if (orderError || !orders || orders.length === 0) return null;

  const customerIds = Array.from(new Set(orders.map(o => o.customer_id)));
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id, customer_id, created_at')
    .in('customer_id', customerIds);

  if (sessionError || !sessions) return null;

  const sessionIds = sessions.map(s => s.session_id);
  const { data: messages, error: messageError } = await supabase
    .from('chat_messages')
    .select('session_id, sent_at')
    .in('session_id', sessionIds);

  if (messageError || !messages) return null;

  let totalThroughputTime = 0;
  let calculatedOrdersCount = 0;

  for (const order of orders) {
    // Find sessions for this customer before order
    const relevantSessions = sessions.filter(
      s => s.customer_id === order.customer_id && s.created_at <= order.order_datetime
    );
    if (relevantSessions.length === 0) continue;
    const relevantSessionIds = relevantSessions.map(s => s.session_id);

    // Find latest message before order
    const relevantMessages = messages.filter(
      m => relevantSessionIds.includes(m.session_id) && m.sent_at < order.order_datetime
    );
    if (relevantMessages.length === 0) continue;
    const latestMessage = relevantMessages.reduce((latest, msg) =>
      new Date(msg.sent_at) > new Date(latest.sent_at) ? msg : latest
    );

    const messageTime = new Date(latestMessage.sent_at).getTime();
    const orderTime = new Date(order.order_datetime).getTime();
    totalThroughputTime += (orderTime - messageTime) / 1000;
    calculatedOrdersCount++;
  }

  if (calculatedOrdersCount === 0) return null;
  return totalThroughputTime / calculatedOrdersCount;
}


/**
 * 6. Percentage of Service Requests Initiated via PRINTY
 * Description: The proportion of total job requests received through the chatbot compared to other channels (email/call).
 * Target Impact: High/Increasing - Confirms user adoption of the new, more efficient channel.
 * Formula: (Total Requests via PRINTY / (Total Requests via PRINTY + Total Requests via Other Channels)) * 100
 */
export async function getOrdersSourcedFromChatRate(range: DateRange, ordersFromOtherChannels: number): Promise<number | null> {
  console.log(`[KPI 6] Fetching Chat Sourced Orders Rate for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Get the distinct customer IDs from chat sessions in the date range.
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('customer_id')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

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
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

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
 * Description: Percentage of job orders generated via PRINTY that do not require manual correction by the administrator due to miscommunication or missing information.
 * Target Impact: High - Shows the chatbot's effectiveness in gathering the necessary and correct specifications upfront.
 * Formula (Implementation Proxy): (Total Non-Cancelled Orders / Total Orders Created) * 100
 */
export async function getJobOrderAccuracyRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 7] Fetching JOAR for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Get the total number of orders created within the specified date range (Denominator).
  const { count: totalOrders, error: totalOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

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
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate)
    .neq('order_status', 'cancelled'); // Filter to exclude cancelled orders

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
  
  // Count entries in chat_session_flow that match the dedicated status inquiry flow
  const { count: inquiryCount, error: countError } = await supabase
    .from('chat_session_flow')
    .select('session_id', { count: 'exact', head: true })
    .eq('flow_id', ORDER_STATUS_FLOW_ID) // Match the specific flow for status checks
    .gte('started_at', range.startDate) // Filter by flow start time
    .lte('started_at', range.endDate);

  if (countError || inquiryCount === null) {
    console.error('[KPI 8 ERROR] Failed to count order status inquiry triggers. Check RLS on chat_session_flow.');
    console.error(countError);
    return null;
  }
  return inquiryCount;
}

/**
 * 8. Order Status Inquiry Rate via PRINTY
 * Description: The average number of status checks per job order created.
 * Target Impact: Diagnostic - A high rate suggests an urgent need to improve proactive order updates or delivery expectations management.
 * Formula: (Total Order Status Inquiry Triggers / Total Job Orders Created)
 */
export async function getOrderStatusInquiryRate(range: DateRange): Promise<number | null> {
  // 1. Get the raw count of status inquiries (Numerator)
  const totalInquiries = await getRawOrderStatusInquiryTriggers(range);
  if (totalInquiries === null) return null;
  console.log(`[KPI 8] Total Inquiries Counted: ${totalInquiries}`);

  // 2. Get the total number of orders created (Denominator).
  const { count: totalOrders, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

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
 * Description: Percentage of the Service Portfolio entries (services offered) that have been reviewed and updated by the administrator within a defined period (e.g., monthly).
 * Target Impact: 100% - Ensures the information provided by PRINTY to customers is always accurate.
 * Formula: (Count of Services Updated in Period / Total Services) * 100
 * ASSUMPTION: Requires a 'service_portfolio' table with a 'last_updated_at' column.
 */
export async function getUpToDateServicePortfolioRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 9] Fetching Portfolio Rate for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Get the total number of services in the portfolio (Denominator).
  const { count: totalServices, error: totalError } = await supabase
    .from('service_portfolio')
    .select('service_id', { count: 'exact', head: true }); 

  if (totalError || totalServices === null || totalServices === 0) {
    console.error('[KPI 9 ERROR] Failed to fetch total services (Denominator). Check RLS on service_portfolio.');
    console.error(totalError);
    return 0;
  }

  // 2. Get the count of services that were updated within the defined range (Numerator).
  const { count: updatedServices, error: updatedError } = await supabase
    .from('service_portfolio')
    .select('service_id', { count: 'exact', head: true })
    .gte('last_updated_at', range.startDate)
    .lte('last_updated_at', range.endDate);

  if (updatedError || updatedServices === null) {
    console.error('[KPI 9 ERROR] Failed to fetch updated services (Numerator). Check RLS on service_portfolio.');
    console.error(updatedError);
    return 0;
  }

  // 3. Calculate the Rate: (Updated Services / Total Services) * 100
  return (updatedServices / totalServices) * 100;
}


/**
 * 10. Service Portfolio Utilization Rate (SPUR)
 * Description: Percentage of total chat sessions that successfully result in the creation of a job order.
 * Target Impact: High - Measures PRINTY's conversion efficiency from interaction to revenue generation.
 * Formula: (Total Job Orders Created / Total Chat Sessions Started) * 100
 */
export async function getServicePortfolioUtilizationRate(range: DateRange): Promise<number | null> {
  console.log(`[KPI 10] Fetching SPUR for range: ${range.startDate} to ${range.endDate}`);
  
  // 1. Get the total number of chat sessions started (Denominator).
  const { count: totalSessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

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
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

  if (orderError || totalOrders === null) {
    console.error('[KPI 10 ERROR] Failed to fetch total orders (Numerator). Check RLS on orders.');
    console.error(orderError);
    return null;
  }

  const totalOrdersCreated = totalOrders;

  // 3. Calculate the Service Portfolio Utilization Rate
  return (totalOrdersCreated / totalSessions) * 100;
}
