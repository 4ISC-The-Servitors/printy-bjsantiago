/**
 * Action handler: display_faq_answer
 *
 * Displays the answer of a selected FAQ with dynamic navigation options.
 * This shows the detailed answer for each FAQ that customers can browse through.
 *
 * @description
 * - Reads FAQ information from session context (set by quick reply selection)
 * - Queries company_faqs table for the selected FAQ's answer
 * - Formats and displays the question and answer
 * - Generates dynamic navigation quick replies for all available FAQs
 * - Reusable for both customer and guest flows
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing selected FAQ info
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer ID (may be null for guest flows)
 *
 * @returns ActionExecutionResult with formatted FAQ answer and navigation options
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "faq_dynamic",
 *   "type": "action",
 *   "action": "display_faq_answer",
 *   "action_config": {
 *     "faq_source": "context"
 *   }
 * }
 * ```
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayFaqAnswer(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Get FAQ information from context
    // The context stores the faq_id (extracted from "faq_id|question")
    const faqId = context?.selected_faq_id;

    if (!faqId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No FAQ selected. Let me take you back to the main menu.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Back to Main Menu',
            value: 'main',
            next: 'welcome',
          },
        ],
      };
    }

    // Fetch FAQ details from database
    const { data: faq, error: faqError } = await supabase
      .from('company_faqs')
      .select('question, answer')
      .eq('faq_id', faqId)
      .single();

    if (faqError || !faq) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'FAQ not found. Let me take you back to the main menu.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Back to Main Menu',
            value: 'main',
            next: 'welcome',
          },
        ],
      };
    }

    const question = faq.question;
    const answer = faq.answer;

    // Format and display just the answer (question is already shown in user's selection)
    let answerMessage = `${answer}`;

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: answerMessage,
      ts: Date.now(),
    });

    // Generate dynamic navigation quick replies
    const quickReplies: Array<{ label: string; value: string; next: string }> =
      [];

    // Fetch all available FAQs for navigation (excluding current FAQ)
    const { data: allFaqs, error: faqsError } = await supabase
      .from('company_faqs')
      .select('faq_id, question, display_order')
      .neq('faq_id', faqId) // Exclude current FAQ
      .order('display_order', { ascending: true });

    if (!faqsError && allFaqs && allFaqs.length > 0) {
      // Add other FAQs as navigation options
      allFaqs.forEach(faq => {
        quickReplies.push({
          label: faq.question,
          value: `${faq.faq_id}|${faq.question}`,
          next: 'faq_dynamic',
        });
      });
    }

    // Add navigation options
    quickReplies.push(
      {
        label: 'End Chat',
        value: 'end',
        next: 'end',
      }
    );

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error('[displayFaqAnswer] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading the FAQ answer. Please try again.',
      ts: Date.now(),
    });

    return {
      messages,
      quickReplies: [
        {
          label: 'End Chat',
          value: 'end',
          next: 'end',
        },
      ],
    };
  }
}