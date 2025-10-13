import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Interface for standard date range filtering.
 * Dates should be provided in a valid string format (e.g., 'YYYY-MM-DD' or ISO 8601).
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

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
