/**
 * Action handler: display_about_sections
 *
 * Displays all active About B.J. Santiago sections as quick replies for customers to explore.
 * This provides a dynamic menu that automatically updates when admins add/edit/delete sections.
 *
 * @description
 * - Queries about_bj_santiago table for all sections ordered by display_order
 * - Generates quick replies for each active section
 * - Each quick reply navigates to about_dynamic node with section info stored in context
 * - Includes "End Chat" option
 * - Reusable for both customer and guest flows
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer ID (may be null for guest flows)
 *
 * @returns ActionExecutionResult with dynamic quick replies for section selection
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "welcome",
 *   "type": "action",
 *   "action": "display_about_sections",
 *   "action_config": {}
 * }
 * ```
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayAboutSections(
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
    // Query all about sections ordered by display_order
    const { data: sections, error } = await supabase
      .from('about_bj_santiago')
      .select('about_id, about_name, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      console.error(
        '[displayAboutSections] Error fetching sections:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading our About Us information. Please try again.',
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
      text: "Hi! I'm Printy, B.J. Santiago's bot assistant. What would you like to know about our company?",
      ts: Date.now(),
    });

    const quickReplies: Array<{ label: string; value: string; next: string }> =
      [];

    if (sections && sections.length > 0) {
      // Generate quick replies for each active section
      sections.forEach(section => {
        quickReplies.push({
          label: section.about_name,
          value: `${section.about_id}|${section.about_name}`,
          next: 'about_dynamic',
        });
      });

      // Add "End Chat" option
      quickReplies.push({
        label: 'End Chat',
        value: 'end',
        next: 'end',
      });
    } else {
      // No sections found
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No About Us information is available at the moment. Please check back later or contact us directly.',
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
    console.error('[displayAboutSections] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading our About Us information. Please try again.',
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