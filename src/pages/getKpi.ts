import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// FIX: Corrected initialization to use supabaseUrl instead of passing the uninitialized 'supabase' object.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ASSUMPTION: This constant must match the specific flow_id used in the
 * 'chat_session_flow' table that corresponds to the customer initiating an
 * order or ticket status check (e.g., "Track Order" or "Check Ticket Status").
 */
const ORDER_STATUS_FLOW_ID = 'order_status_inquiry_flow'; 

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
 * 1. Chatbot First-Contact Resolution Rate (FCR) KPI
 * Percentage of sessions where the chatbot resolved the user's inquiry without
 * requiring transfer to a human agent, and the session was marked as 'ended'.
 * Formula: (Total Resolved Sessions by PRINTY / Total Sessions) * 100
 */
export async function getFirstContactResolutionRate(range: DateRange): Promise<number | null> {
  // 1. Get the total number of sessions in the specified range (the denominator).
  const { count: totalSessions, error: countError } = await supabase
    .from('chat_sessions')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (countError || totalSessions === null) return null;
  if (totalSessions === 0) return 0;

  // 2. Get the number of sessions that meet the criteria for FCR within the range:
  //    a) Does not reference an inquiry_id (i.e., was not escalated).
  //    b) Has a status of 'ended' (i.e., was successfully completed).
  const { count: resolvedSessions, error: resolvedError } = await supabase
    .from('chat_sessions')
    .select('session_id', { count: 'exact', head: true })
    .is('inquiry_id', null)
    .eq('status', 'ended')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (resolvedError || resolvedSessions === null) return null;

  const totalResolvedByPrinty = resolvedSessions;

  // 3. Calculate the First Contact Resolution Rate
  // FCR = (Total Resolved by PRINTY / Total Sessions) * 100
  return (totalResolvedByPrinty / totalSessions) * 100;
}


/**
 * 2. Average Response Time for Initial Inquiry
 * Computes the average response time (in seconds) from customer initial message to PRINTY's first reply,
 * only for sessions within the specified date range.
 */
export async function getAverageInitialResponseTime(range: DateRange): Promise<number | null> {
  // 1. Get all chat sessions in the specified date range
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (sessionError || !sessions) return null;

  let totalResponseTime = 0;
  let count = 0;

  for (const session of sessions) {
    // 2. Get all messages for this session, ordered by sent_at
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('message_id, sent_at')
      .eq('session_id', session.session_id)
      .order('sent_at', { ascending: true });

    if (msgError || !messages || messages.length < 2) continue;

    // 3. Get sender_role for each message
    const { data: metas, error: metaError } = await supabase
      .from('chat_message_meta')
      .select('message_id, sender_role')
      .in('message_id', messages.map(m => m.message_id));

    if (metaError || !metas) continue;

    // 4. Find first customer message and first printy reply after it
    let customerMsg = null;
    let printyMsg = null;
    for (const msg of messages) {
      const meta = metas.find(m => m.message_id === msg.message_id);
      if (!meta) continue;
      if (!customerMsg && meta.sender_role === 'customer') {
        customerMsg = msg;
      }
      if (customerMsg && meta.sender_role === 'printy') {
        printyMsg = msg;
        break;
      }
    }

    if (customerMsg && printyMsg) {
      const start = new Date(customerMsg.sent_at).getTime();
      const end = new Date(printyMsg.sent_at).getTime();
      const diffSeconds = (end - start) / 1000;
      totalResponseTime += diffSeconds;
      count++;
    }
  }

  if (count === 0) return null;
  return totalResponseTime / count;
}


/**
 * 3. Customer Satisfaction Score (CSAT) for PRINTY
 * Computes the average feedback_rating for sessions within a specified date range.
 * Formula: Average(feedback_rating) on filtered chat_sessions.
 */
export async function getAverageCustomerSatisfactionScore(range: DateRange): Promise<number | null> {
  // 1. Use the Supabase aggregate function 'avg' to compute the average rating
  const { data: avgData, error: avgError } = await supabase
    .from('chat_sessions')
    .select(`
        avg(feedback_rating)
    `)
    // Filter to only include sessions within the specified date range
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate)
    // Exclude sessions where the feedback_rating is null (unrated sessions)
    .not('feedback_rating', 'is', null)
    .limit(1); // Limit to 1 row since we are only getting one aggregate result

  if (avgError || !avgData || avgData.length === 0) {
    console.error('Error fetching average CSAT:', avgError);
    return null;
  }

  const averageRating = avgData[0].avg;

  // Check if the average is valid (could be null if no records matched the filters)
  if (averageRating === null) return null;

  // Supabase returns the avg as a string in some environments; parse it to a float.
  // Cast to 'unknown' first to satisfy strict TypeScript conversion rules.
  return parseFloat(averageRating as unknown as string);
}


/**
 * 4. Escalation Rate KPI
 * Percentage of PRINTY interactions that require escalation to a human administrator,
 * calculated only for sessions within the specified date range.
 * Formula: (total inquiries transferred to admin / total inquiries handled by PRINTY) * 100
 */
export async function getEscalationRate(range: DateRange): Promise<number | null> {
  // 1. Get all unique session_ids handled by PRINTY in the specified date range
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id, inquiry_id')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (sessionError || !sessions) return null;

  const totalHandled = sessions.length;

  // 2. Count sessions that have a linked inquiry_id in the inquiries table (i.e., transferred to admin)
  const inquiryIds = sessions
    .map(s => s.inquiry_id)
    .filter(id => !!id);

  if (totalHandled === 0) return 0;
  if (inquiryIds.length === 0) return 0;

  // Note: We still need to count how many of the filtered sessions actually created an inquiry record.
  // The 'inquiries' table is not filtered by date, but since 'inquiry_id' is only present
  // if created by a 'chat_session' within the date range, the result is implicitly filtered.
  const { data: inquiries, error: inquiryError } = await supabase
    .from('inquiries')
    .select('inquiry_id')
    .in('inquiry_id', inquiryIds);

  if (inquiryError || !inquiries) return null;

  const totalTransferred = inquiries.length;

  // 3. Calculate escalation rate
  return (totalTransferred / totalHandled) * 100;
}


/**
 * 5. Average Service Request Throughput Time (SRTT)
 * Description: Average time elapsed (in seconds) from the customer's last message *before* placing an order
 * to the moment the corresponding job order is created in the 'orders' table.
 */
export async function getAverageServiceRequestThroughputTime(range: DateRange): Promise<number | null> {
  // 1. Get all relevant orders within the specified date range.
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('order_id, customer_id, order_datetime')
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

  if (orderError || !orders || orders.length === 0) {
    console.error('Error fetching orders for SRTT:', orderError);
    return null; // Return null if there are no orders in the range or an error occurred.
  }

  let totalThroughputTime = 0;
  let calculatedOrdersCount = 0;

  // We iterate through each order to find the corresponding pre-order message time.
  for (const order of orders) {
    // 2. Get all chat session IDs for this customer that occurred BEFORE the order was placed.
    const { data: sessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('session_id')
      .eq('customer_id', order.customer_id)
      // Filter sessions that started before the order was placed (optimization)
      .lte('created_at', order.order_datetime);

    if (sessionError || !sessions || sessions.length === 0) {
      continue; // Skip if no prior chat sessions found for this customer before the order.
    }

    const sessionIds = sessions.map(s => s.session_id);

    // 3. Find the latest message timestamp from the customer BEFORE the order_datetime.
    const { data: latestMessage, error: messageError } = await supabase
      .from('chat_messages')
      .select('sent_at')
      .in('session_id', sessionIds)
      .lt('sent_at', order.order_datetime) // Crucial: Message must be BEFORE order_datetime
      .order('sent_at', { ascending: false })
      .limit(1); // We only need the single latest message

    if (messageError || !latestMessage || latestMessage.length === 0) {
      continue; // Skip if no relevant pre-order message was found.
    }

    // 4. Calculate the throughput time for this single order (in seconds).
    const messageTime = new Date(latestMessage[0].sent_at).getTime();
    const orderTime = new Date(order.order_datetime).getTime();

    // The subtraction is robust against timestamp vs timestamptz because JS Date objects handle ISO strings (which Supabase returns) correctly.
    const diffSeconds = (orderTime - messageTime) / 1000;

    totalThroughputTime += diffSeconds;
    calculatedOrdersCount++;
  }

  // 5. Calculate the average SRTT.
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
  // 1. Get the distinct customer IDs from chat sessions in the date range.
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('customer_id')
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (sessionError || !sessions) return null;

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

  if (orderError || totalOrdersViaPrinty === null) return null;

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
  // 1. Get the total number of orders created within the specified date range (Denominator).
  const { count: totalOrders, error: totalOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

  if (totalOrdersError || totalOrders === null) {
    console.error('Error fetching total orders for JOAR:', totalOrdersError);
    return null;
  }

  if (totalOrders === 0) return 0;

  // 2. Get the number of orders that were *not* cancelled (Numerator).
  // This counts all orders that are either completed, ongoing, or have any status other than 'cancelled'.
  const { count: accurateOrders, error: accurateOrdersError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate)
    .neq('order_status', 'cancelled'); // Filter to exclude cancelled orders

  if (accurateOrdersError || accurateOrders === null) {
    console.error('Error fetching non-cancelled orders for JOAR:', accurateOrdersError);
    return null;
  }

  const totalNonCancelledOrders = accurateOrders;

  // 3. Calculate the Job Order Accuracy Rate
  // JOAR = (Total Non-Cancelled Orders / Total Orders) * 100
  return (totalNonCancelledOrders / totalOrders) * 100;
}


/**
 * Helper function to get the raw count of order status inquiry flows.
 */
async function getRawOrderStatusInquiryTriggers(range: DateRange): Promise<number | null> {
  // Count entries in chat_session_flow that match the dedicated status inquiry flow
  const { count: inquiryCount, error: countError } = await supabase
    .from('chat_session_flow')
    .select('session_id', { count: 'exact', head: true })
    .eq('flow_id', ORDER_STATUS_FLOW_ID) // Match the specific flow for status checks
    .gte('started_at', range.startDate) // Filter by flow start time
    .lte('started_at', range.endDate);

  if (countError || inquiryCount === null) {
    console.error('Error counting order status inquiry triggers:', countError);
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

  // 2. Get the total number of orders created (Denominator).
  const { count: totalOrders, error: orderError } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('order_datetime', range.startDate)
    .lte('order_datetime', range.endDate);

  if (orderError || totalOrders === null) {
    console.error('Error fetching total orders for Inquiry Rate:', orderError);
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
  // 1. Get the total number of services in the portfolio (Denominator).
  const { count: totalServices, error: totalError } = await supabase
    .from('service_portfolio')
    .select('service_id', { count: 'exact', head: true }); 

  if (totalError || totalServices === null || totalServices === 0) return 0;

  // 2. Get the count of services that were updated within the defined range (Numerator).
  const { count: updatedServices, error: updatedError } = await supabase
    .from('service_portfolio')
    .select('service_id', { count: 'exact', head: true })
    .gte('last_updated_at', range.startDate)
    .lte('last_updated_at', range.endDate);

  if (updatedError || updatedServices === null) return 0;

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
  // 1. Get the total number of chat sessions started (Denominator).
  const { count: totalSessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate);

  if (sessionError || totalSessions === null) {
    console.error('Error fetching total sessions for SPUR:', sessionError);
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
    console.error('Error fetching total orders for SPUR:', orderError);
    return null;
  }

  const totalOrdersCreated = totalOrders;

  // 3. Calculate the Service Portfolio Utilization Rate
  // SPUR = (Total Orders Created / Total Sessions Started) * 100
  return (totalOrdersCreated / totalSessions) * 100;
}
