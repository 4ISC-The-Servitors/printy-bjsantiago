/**
 * Action handler: display_faqs
 *
 * Displays all active company FAQs as quick replies for customers to explore.
 * This provides a dynamic menu that automatically updates when admins add/edit/delete FAQs.
 *
 * @description
 * - Queries company_faqs table for all FAQs ordered by display_order
 * - Generates quick replies for each active FAQ question
 * - Each quick reply navigates to faq_dynamic node with FAQ info stored in context
 * - Includes "End Chat" option
 * - Reusable for both customer and guest flows
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer ID (may be null for guest flows)
 *
 * @returns ActionExecutionResult with dynamic quick replies for FAQ selection
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "welcome",
 *   "type": "action",
 *   "action": "display_faqs",
 *   "action_config": {}
 * }
 * ```
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayFaqs(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const {} = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Query all FAQs ordered by display_order
    const { data: faqs, error } = await supabase
      .from('company_faqs')
      .select('faq_id, question, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      console.error(
        '[displayFaqs] Error fetching FAQs:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading our Frequently Asked Questions. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Try Again',
            value: 'retry',
            next: 'welcome',
          },
        ],
      };
    }

    // Add welcome message
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: "Hi! I'm Printy, B.J. Santiago's bot assistant. Here are some frequently asked questions. What would you like to know?",
      ts: Date.now(),
    });

    const quickReplies: Array<{ label: string; value: string; next: string }> =
      [];

    if (faqs && faqs.length > 0) {
      // Generate quick replies for each active FAQ
      faqs.forEach(faq => {
        quickReplies.push({
          label: faq.question,
          value: `${faq.faq_id}|${faq.question}`,
          next: 'faq_dynamic',
        });
      });

      // Add "End Chat" option
      quickReplies.push({
        label: 'End Chat',
        value: 'end',
        next: 'end',
      });
    } else {
      // No FAQs found
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No FAQs are available at the moment. Please check back later or contact us directly.',
        ts: Date.now(),
      });

      quickReplies.push({
        label: 'End Chat',
        value: 'end',
        next: 'end',
      });
    }

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error('[displayFaqs] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading our FAQs. Please try again.',
      ts: Date.now(),
    });

    return {
      messages,
      quickReplies: [
        {
          label: 'Try Again',
          value: 'retry',
          next: 'welcome',
        },
      ],
    };
  }
}