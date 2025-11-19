/**
 * Action handler: create_faq_admin
 *
 * Creates a new FAQ entry in company_faqs.
 */

import { supabase } from '@lib/supabase';
import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function createFaqAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const config = params.actionNode?.action_config as Record<string, any>;
    const questionKey = config?.question_key || 'faq_question';
    const answerKey = config?.answer_key || 'faq_answer';

    const rawQuestion = params.context?.[questionKey];
    const rawAnswer = params.context?.[answerKey];

    const question =
      rawQuestion === undefined || rawQuestion === null
        ? ''
        : String(rawQuestion).trim();
    const answer =
      rawAnswer === undefined || rawAnswer === null
        ? ''
        : String(rawAnswer).trim();

    if (!question) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'The question cannot be empty. Please provide a valid question.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!answer) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Please provide an answer for this question.',
        ts: Date.now(),
      });
      return { messages };
    }

    const { data: existingFaq, error: lookupError } = await supabase
      .from('company_faqs')
      .select('faq_id')
      .ilike('question', question)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('[createFaqAdmin] Error checking existing FAQ:', lookupError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I was unable to validate the question. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (existingFaq) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `An FAQ with the question "${question}" already exists. Please use a different question.`,
        ts: Date.now(),
      });
      return { messages };
    }

    const adminUserId = await getAdminUserId();
    const { data, error } = await supabase
      .from('company_faqs')
      .insert({
        question,
        answer,
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .select('faq_id')
      .single();

    if (error) {
      console.error('[createFaqAdmin] Error creating FAQ:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not save the FAQ. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'FAQ has been added successfully.',
      ts: Date.now(),
    });

    return {
      messages,
      context: data
        ? {
            created_faq_id: data.faq_id,
            selected_faq_id: data.faq_id,
          }
        : undefined,
    };
  } catch (error) {
    console.error('[createFaqAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while creating the FAQ. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}

