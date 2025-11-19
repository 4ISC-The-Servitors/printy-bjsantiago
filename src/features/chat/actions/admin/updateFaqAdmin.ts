/**
 * Action handler: update_faq_admin
 *
 * Updates an existing FAQ question/answer.
 */

import { supabase } from '@lib/supabase';
import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function updateFaqAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const config = params.actionNode?.action_config as Record<string, any>;
    const faqIdKey = config?.faq_id_key || 'selected_faq_id';
    const questionKey = config?.question_key || 'updated_faq_question';
    const answerKey = config?.answer_key || 'updated_faq_answer';

    const rawFaqId = params.context?.[faqIdKey];
    const faqIdCandidate =
      typeof rawFaqId === 'string'
        ? rawFaqId
        : rawFaqId !== undefined && rawFaqId !== null
          ? String(rawFaqId)
          : '';
    const faqId = faqIdCandidate.split('|')[0]?.trim();

    if (!faqId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not identify which FAQ to update. Please select an FAQ again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const updates: Record<string, any> = {};

    if (questionKey in (params.context || {})) {
      const rawQuestion = params.context?.[questionKey];
      const question =
        rawQuestion === undefined || rawQuestion === null
          ? ''
          : String(rawQuestion).trim();
      if (!question) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'The new question cannot be empty.',
          ts: Date.now(),
        });
        return { messages };
      }
      updates.question = question;
    }

    if (answerKey in (params.context || {})) {
      const rawAnswer = params.context?.[answerKey];
      const answer =
        rawAnswer === undefined || rawAnswer === null
          ? ''
          : String(rawAnswer).trim();
      if (!answer) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'The answer cannot be empty.',
          ts: Date.now(),
        });
        return { messages };
      }
      updates.answer = answer;
    }

    if (Object.keys(updates).length === 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No changes were provided. Please enter an updated question or answer.',
        ts: Date.now(),
      });
      return { messages };
    }

    const adminUserId = await getAdminUserId();
    updates.updated_by = adminUserId;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('company_faqs')
      .update(updates)
      .eq('faq_id', faqId);

    if (error) {
      console.error('[updateFaqAdmin] Error updating FAQ:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not save the updates. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'FAQ updated successfully.',
      ts: Date.now(),
    });

    return {
      messages,
      context: {
        selected_faq_id: faqId,
      },
    };
  } catch (error) {
    console.error('[updateFaqAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while updating the FAQ. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}

