/**
 * Action handler: display_faqs_admin
 *
 * Lists company FAQs so admins can select one to edit or delete.
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayFaqsAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const { data, error } = await supabase
      .from('company_faqs')
      .select('faq_id, question, updated_at')
      .order('created_at', { ascending: true });

    const config = params.actionNode?.action_config as Record<string, any>;
    const promptMessage =
      config?.message ||
      'Select the FAQ you want to review or update.';
    const emptyMessage =
      config?.empty_message ||
      'There are no FAQs yet. Use Add FAQ to create one.';
    const nextNode = config?.next_node || 'choose_faq_edit_action';
    const emptyNextNode = config?.empty_next_node || 'add_faq_question';

    if (error) {
      console.error('[displayFaqsAdmin] Error loading FAQs:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading the FAQ list. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Try Again',
            value: 'retry',
            next: params.actionNode.next || 'intro',
          },
        ],
      };
    }

    if (!data || data.length === 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: emptyMessage,
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Add FAQ',
            value: 'add_faq',
            next: emptyNextNode,
          },
        ],
      };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: promptMessage,
      ts: Date.now(),
    });

    const quickReplies = data.map(faq => ({
      label: faq.question,
      value: `${faq.faq_id}|${faq.question}`,
      next: nextNode,
      store_as: 'selected_faq_id',
    }));

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error('[displayFaqsAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading FAQs. Please try again.',
      ts: Date.now(),
    });
    return {
      messages,
      quickReplies: [
        {
          label: 'Try Again',
          value: 'retry',
          next: params.actionNode.next || 'intro',
        },
      ],
    };
  }
}

