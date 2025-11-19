/**
 * Action handler: delete_faq_admin
 *
 * Deletes an FAQ entry.
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function deleteFaqAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const config = params.actionNode?.action_config as Record<string, any>;
    const faqIdKey = config?.faq_id_key || 'selected_faq_id';

    const rawValue = params.context?.[faqIdKey];
    const faqIdCandidate =
      typeof rawValue === 'string'
        ? rawValue
        : rawValue !== undefined && rawValue !== null
          ? String(rawValue)
          : '';
    const faqId = faqIdCandidate.split('|')[0]?.trim();

    if (!faqId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not determine which FAQ to delete. Please select an FAQ again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const { data, error } = await supabase
      .from('company_faqs')
      .delete()
      .eq('faq_id', faqId)
      .select('question')
      .maybeSingle();

    if (error) {
      console.error('[deleteFaqAdmin] Error deleting FAQ:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I was unable to delete that FAQ. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `FAQ "${data?.question || 'entry'}" has been removed.`,
      ts: Date.now(),
    });

    return {
      messages,
      context: {
        deleted_faq_id: faqId,
        selected_faq_id: null,
      },
    };
  } catch (error) {
    console.error('[deleteFaqAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while deleting the FAQ. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}

