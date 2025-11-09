import { supabase } from '@lib/supabase';

// --- GLOBAL CONFIGURATION CONSTANTS ---
const ESCALATION_FLOW_IDS = [
  'ask-assistance',
  'ask-quote',
  'issue-ticket',
  'track-quote',
];

const ORDER_STATUS_INQUIRY_FLOW_IDS = [
  'track-order',
  'track-quote',
  'ask-assistance',
];

export interface DateRange {
  startDate: string; // 'YYYY-MM-DD' or ISO
  endDate: string;   // 'YYYY-MM-DD' or ISO
}

function getNextDayString(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z');
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * KPI 1: First Contact Resolution Rate
 * Uses chat_sessions_v2 only (no views).
 */
export async function getFirstContactResolutionRate(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalSessions, error: totalErr } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (totalErr || totalSessions === null || totalSessions === 0) {
    console.debug('[KPI 1] totalSessions=', totalSessions, 'error=', totalErr);
    return 0;
  }

  const { data: escalated, error: escErr } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .in('flow_id', ESCALATION_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (escErr) {
    console.debug('[KPI 1] escalated fetch error=', escErr);
    return null;
  }
  const escalatedSet = new Set((escalated ?? []).map((r: any) => r.session_id));

  const { data: ended, error: endErr } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .eq('status', 'ended')
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (endErr) {
    console.debug('[KPI 1] ended fetch error=', endErr);
    return null;
  }

  const nonEscalatedResolved = (ended ?? []).filter((s: any) => !escalatedSet.has(s.session_id)).length;

  console.debug('[KPI 1]', {
    range,
    totalSessions,
    escalatedCount: escalatedSet.size,
    endedCount: (ended ?? []).length,
    nonEscalatedResolved,
  });

  return (nonEscalatedResolved / totalSessions) * 100;
}

/**
 * KPI 2: Average Initial Response Time
 * Computes per-session first customer message -> first printy reply after it using chat_messages_v2.
 */
export async function getAverageInitialResponseTime(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { data: messages, error } = await supabase
    .from('chat_messages_v2')
    .select('session_id, sender_role, sent_at')
    .gte('sent_at', range.startDate)
    .lt('sent_at', exclusiveEndDate);

  const messagesArr = (messages ?? []) as any[]; // avoid implicit-any / undefined issues

  if (error || messagesArr.length === 0) {
    console.debug('[KPI 2] messages fetch error or empty', { error, messagesLength: messagesArr.length });
    return null;
  }

  const bySession = new Map<string, { customerFirst?: string; printyFirstAfter?: string }>();

  for (const m of messagesArr) {
    const sid = String(m.session_id);
    const entry = bySession.get(sid) ?? {};
    if (m.sender_role === 'customer') {
      if (!entry.customerFirst || new Date(m.sent_at) < new Date(entry.customerFirst)) {
        entry.customerFirst = m.sent_at;
      }
    }
    bySession.set(sid, entry);
  }

  // For printy responses, find first printy message after customerFirst
  for (const m of messagesArr) {
    if (m.sender_role !== 'printy') continue;
    const sid = String(m.session_id);
    const entry = bySession.get(sid);
    if (!entry || !entry.customerFirst) continue;
    const custAt = new Date(entry.customerFirst);
    const printAt = new Date(m.sent_at);
    if (printAt > custAt) {
      if (!entry.printyFirstAfter || printAt < new Date(entry.printyFirstAfter)) {
        entry.printyFirstAfter = m.sent_at;
        bySession.set(sid, entry);
      }
    }
  }

  const responseSeconds: number[] = [];
  for (const [, v] of bySession) {
    if (v.customerFirst && v.printyFirstAfter) {
      const diff = (new Date(v.printyFirstAfter).getTime() - new Date(v.customerFirst).getTime()) / 1000;
      if (Number.isFinite(diff) && diff >= 0) responseSeconds.push(diff);
    }
  }

  console.debug('[KPI 2]', {
    range,
    messagesCount: messagesArr.length,
    sessionsConsidered: bySession.size,
    responseSamples: responseSeconds.length,
    sampleFirst: responseSeconds[0] ?? null,
  });

  if (responseSeconds.length === 0) return null;
  const sum = responseSeconds.reduce((s, x) => s + x, 0);
  return sum / responseSeconds.length;
}

/**
 * KPI 3: Average Customer Satisfaction Score
 * Uses chat_session_feedback.
 */
export async function getAverageCustomerSatisfactionScore(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { data, error } = await supabase
    .from('chat_session_feedback')
    .select('rating')
    .gte('submitted_at', range.startDate)
    .lt('submitted_at', exclusiveEndDate);

  if (error) {
    console.debug('[KPI 3] feedback fetch error=', error);
    return null;
  }
  const count = data?.length ?? 0;
  const avg = count === 0 ? 0 : data.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / count;

  console.debug('[KPI 3]', { range, feedbackCount: count, avg });

  if (!data || data.length === 0) return 0;
  return avg;
}

/**
 * KPI 4: Escalation Rate
 * Uses chat_sessions_v2.
 */
export async function getEscalationRate(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalSessions, error: totalErr } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (totalErr || totalSessions === null || totalSessions === 0) {
    console.debug('[KPI 4] totalSessions fetch error or zero', { totalErr, totalSessions });
    return 0;
  }

  const { data: escalated, error: escErr } = await supabase
    .from('chat_sessions_v2')
    .select('session_id')
    .in('flow_id', ESCALATION_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (escErr) {
    console.debug('[KPI 4] escalated fetch error=', escErr);
    return null;
  }
  const escalatedCount = Array.from(new Set((escalated ?? []).map((r: any) => r.session_id))).length;

  console.debug('[KPI 4]', { range, totalSessions, escalatedCount });

  return (escalatedCount / totalSessions) * 100;
}

/**
 * KPI 5: Average Service Request Throughput Time (SRTT)
 * Primary: orders linked to quote_id -> earliest session for that quote.
 * Fallback: latest session before order per customer.
 */
async function calculateSrttByQuoteLinkage(range: DateRange, exclusiveEndDate: string) {
  const { data: orders, error: ordErr } = await supabase
    .from('orders')
    .select('order_id, quote_id, created_at')
    .not('quote_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  const ordersArr = (orders ?? []) as any[];

  if (ordErr || ordersArr.length === 0) {
    console.debug('[KPI 5 - quote] no orders or error', { ordErr, ordersLength: ordersArr.length });
    return null;
  }

  const times: number[] = [];

  for (const o of ordersArr) {
    const quoteId = o.quote_id;
    if (!quoteId) continue;

    // Get earliest chat session for this quote_id deterministically
    const { data: sessions, error: sErr } = await supabase
      .from('chat_sessions_v2')
      .select('created_at')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true })
      .limit(1);

    const sessionsArr = (sessions ?? []) as any[];
    if (sErr || sessionsArr.length === 0) continue;
    const minCreatedAt = sessionsArr[0]?.created_at;
    if (!minCreatedAt) continue;

    const diff = (new Date(o.created_at).getTime() - new Date(minCreatedAt).getTime()) / 1000;
    if (Number.isFinite(diff) && diff >= 0) times.push(diff);
  }

  console.debug('[KPI 5 - quote]', { range, ordersCount: ordersArr.length, throughputSamples: times.length });

  if (times.length === 0) return null;
  return { time: times.reduce((s, v) => s + v, 0), count: times.length };
}

async function calculateSrttByCustomerLinkage(range: DateRange, exclusiveEndDate: string) {
  const { data: orders, error: ordErr } = await supabase
    .from('orders')
    .select('order_id, customer_id, created_at')
    .not('customer_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  const ordersArr = (orders ?? []) as any[];

  if (ordErr || ordersArr.length === 0) {
    console.debug('[KPI 5 - cust] no orders or error', { ordErr, ordersLength: ordersArr.length });
    return null;
  }

  const times: number[] = [];

  for (const o of ordersArr) {
    const customerId = o.customer_id;
    if (!customerId) continue;
    const { data: sessions, error: sErr } = await supabase
      .from('chat_sessions_v2')
      .select('created_at')
      .eq('customer_id', customerId)
      .lt('created_at', o.created_at)
      .order('created_at', { ascending: false })
      .limit(1);

    const sessionsArr = (sessions ?? []) as any[];
    if (sErr || sessionsArr.length === 0) continue;
    const sessionCreatedAt = sessionsArr[0].created_at;
    if (!sessionCreatedAt) continue;
    const diff = (new Date(o.created_at).getTime() - new Date(sessionCreatedAt).getTime()) / 1000;
    if (Number.isFinite(diff) && diff >= 0) times.push(diff);
  }

  console.debug('[KPI 5 - cust]', { range, ordersCount: ordersArr.length, throughputSamples: times.length });

  if (times.length === 0) return null;
  return { time: times.reduce((s, v) => s + v, 0), count: times.length };
}

export async function getAverageServiceRequestThroughputTime(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);
  const primary = await calculateSrttByQuoteLinkage(range, exclusiveEndDate);
  if (primary) {
    const avg = primary.time / primary.count;
    console.debug('[KPI 5] used quote linkage', { avg, samples: primary.count });
    return avg;
  }
  const fallback = await calculateSrttByCustomerLinkage(range, exclusiveEndDate);
  if (fallback) {
    const avg = fallback.time / fallback.count;
    console.debug('[KPI 5] used customer linkage fallback', { avg, samples: fallback.count });
    return avg;
  }
  console.debug('[KPI 5] no throughput samples found');
  return null;
}

/**
 * KPI 6: Orders Sourced From Chat Rate
 * Primary: match orders by quote_id produced in chat sessions in range.
 * Fallback: match orders by customers who had chats in range.
 */
async function getOrdersSourcedFromChatByQuoteLinkage(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
  const { data: sessions, error: sessErr } = await supabase
    .from('chat_sessions_v2')
    .select('quote_id')
    .not('quote_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessErr) {
    console.debug('[KPI 6 - quote] sessions fetch error', sessErr);
    return null;
  }
  const quoteIds = Array.from(new Set((sessions ?? []).map((s: any) => s.quote_id).filter(Boolean)));
  console.debug('[KPI 6 - quote] quoteIdsCount=', quoteIds.length);

  if (quoteIds.length === 0) return 0;

  const { count, error: orderErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .in('quote_id', quoteIds)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderErr || count === null) {
    console.debug('[KPI 6 - quote] orders count error', orderErr);
    return null;
  }

  console.debug('[KPI 6 - quote] ordersMatched=', count);
  return count;
}

async function getOrdersSourcedFromChatByCustomerLinkage(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
  const { data: sessions, error: sessErr } = await supabase
    .from('chat_sessions_v2')
    .select('customer_id')
    .not('customer_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessErr) {
    console.debug('[KPI 6 - cust] sessions fetch error', sessErr);
    return null;
  }
  const customerIds = Array.from(new Set((sessions ?? []).map((s: any) => s.customer_id).filter(Boolean)));
  console.debug('[KPI 6 - cust] customerIdsCount=', customerIds.length);

  if (customerIds.length === 0) return 0;

  const { count, error: orderErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .in('customer_id', customerIds)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderErr || count === null) {
    console.debug('[KPI 6 - cust] orders count error', orderErr);
    return null;
  }

  console.debug('[KPI 6 - cust] ordersMatched=', count);
  return count;
}

export async function getOrdersSourcedFromChatRate(range: DateRange, ordersFromOtherChannels: number): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  let sourced = await getOrdersSourcedFromChatByQuoteLinkage(range, exclusiveEndDate);
  let sourceUsed = 'quote';
  if (sourced === null || sourced === 0) {
    sourced = await getOrdersSourcedFromChatByCustomerLinkage(range, exclusiveEndDate);
    sourceUsed = 'customer';
    if (sourced === null) {
      console.debug('[KPI 6] both quote and customer linkage returned null');
      return null;
    }
  }

  const totalAll = sourced + ordersFromOtherChannels;
  const pct = totalAll === 0 ? 0 : (sourced / totalAll) * 100;

  console.debug('[KPI 6]', { range, sourceUsed, sourced, ordersFromOtherChannels, totalAll, pct });

  if (totalAll === 0) return 0;
  return pct;
}

/**
 * KPI 7: Job Order Accuracy Rate (JOAR)
 */
export async function getJobOrderAccuracyRate(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalOrders, error: totErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (totErr || totalOrders === null || totalOrders === 0) {
    console.debug('[KPI 7] totalOrders fetch error or zero', { totErr, totalOrders });
    return 0;
  }

  const { count: goodOrders, error: goodErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate)
    .neq('status', 'cancelled');

  if (goodErr || goodOrders === null) {
    console.debug('[KPI 7] goodOrders fetch error', goodErr);
    return null;
  }

  console.debug('[KPI 7]', { range, totalOrders, goodOrders });

  return (goodOrders / totalOrders) * 100;
}

/**
 * KPI 8: Order Status Inquiry Rate
 */
async function getRawOrderStatusInquiryTriggersByInquiryId(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select('inquiry_id')
    .in('flow_id', ORDER_STATUS_INQUIRY_FLOW_IDS)
    .not('inquiry_id', 'is', null)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (error) {
    console.debug('[KPI 8 - inquiryId] fetch error', error);
    return null;
  }
  const unique = Array.from(new Set((data ?? []).map((r: any) => r.inquiry_id).filter(Boolean)));
  console.debug('[KPI 8 - inquiryId]', { range, returned: (data ?? []).length, uniqueCount: unique.length });
  return unique.length;
}

async function getRawOrderStatusInquiryTriggersByFlowId(range: DateRange, exclusiveEndDate: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .in('flow_id', ORDER_STATUS_INQUIRY_FLOW_IDS)
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (error || count === null) {
    console.debug('[KPI 8 - flowId] fetch error', error);
    return null;
  }
  console.debug('[KPI 8 - flowId]', { range, flowCount: count });
  return count;
}

export async function getOrderStatusInquiryRate(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  let inquiries = await getRawOrderStatusInquiryTriggersByInquiryId(range, exclusiveEndDate);
  if (inquiries === null || inquiries === 0) {
    inquiries = await getRawOrderStatusInquiryTriggersByFlowId(range, exclusiveEndDate);
    if (inquiries === null) {
      console.debug('[KPI 8] both inquiryId and flowId retrieval failed');
      return null;
    }
  }

  const { count: totalOrders, error: orderErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (orderErr || totalOrders === null || totalOrders === 0) {
    console.debug('[KPI 8] totalOrders fetch error or zero', { orderErr, totalOrders });
    return inquiries > 0 ? null : 0;
  }

  console.debug('[KPI 8]', { range, inquiries, totalOrders, rate: inquiries / totalOrders });

  return inquiries / totalOrders;
}

/**
 * KPI 9: Up-To-Date Service Portfolio Rate
 */
export async function getUpToDateServicePortfolioRate(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalServices, error: totErr } = await supabase
    .from('printing_services')
    .select('service_id', { count: 'exact', head: true });

  if (totErr || totalServices === null || totalServices === 0) {
    console.debug('[KPI 9] totalServices fetch error or zero', { totErr, totalServices });
    return 0;
  }

  const { count: updated, error: updErr } = await supabase
    .from('printing_services')
    .select('service_id', { count: 'exact', head: true })
    .gte('updated_at', range.startDate)
    .lt('updated_at', exclusiveEndDate);

  if (updErr || updated === null) {
    console.debug('[KPI 9] updated fetch error', updErr);
    return 0;
  }

  console.debug('[KPI 9]', { range, totalServices, updated });

  return (updated / totalServices) * 100;
}

/**
 * KPI 10: Service Portfolio Utilization Rate (SPUR)
 */
export async function getServicePortfolioUtilizationRate(range: DateRange): Promise<number | null> {
  const exclusiveEndDate = getNextDayString(range.endDate);

  const { count: totalSessions, error: sessErr } = await supabase
    .from('chat_sessions_v2')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (sessErr || totalSessions === null) {
    console.debug('[KPI 10] session fetch error', sessErr);
    return null;
  }
  if (totalSessions === 0) {
    console.debug('[KPI 10] no sessions in range', { range });
    return 0;
  }

  const { count: totalOrders, error: ordErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .gte('created_at', range.startDate)
    .lt('created_at', exclusiveEndDate);

  if (ordErr || totalOrders === null) {
    console.debug('[KPI 10] orders fetch error', ordErr);
    return null;
  }

  console.debug('[KPI 10]', { range, totalSessions, totalOrders });

  return (totalOrders / totalSessions) * 100;
}