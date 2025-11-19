/**
 * Action handler: display_about_content
 *
 * Displays the content of a selected About B.J. Santiago section with dynamic navigation options.
 * This shows the detailed content for each section that customers can browse through.
 *
 * @description
 * - Reads section information from session context (set by quick reply selection)
 * - Queries about_bj_santiago table for the selected section's content
 * - Formats and displays the section content
 * - Generates dynamic navigation quick replies for all available sections
 * - Reusable for both customer and guest flows
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing selected section info
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer ID (may be null for guest flows)
 *
 * @returns ActionExecutionResult with formatted section content and navigation options
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "about_dynamic",
 *   "type": "action",
 *   "action": "display_about_content",
 *   "action_config": {
 *     "about_source": "context"
 *   }
 * }
 * ```
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayAboutContent(
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
    // Get section information from context
    // The context stores the about_id (extracted from "about_id|about_name")
    const aboutId = context?.selected_about_id;

    if (!aboutId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No section selected. Let me take you back to the main menu.',
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

    // Fetch section details from database
    const { data: section, error: sectionError } = await supabase
      .from('about_bj_santiago')
      .select('about_name, description')
      .eq('about_id', aboutId)
      .single();

    if (sectionError || !section) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Section not found. Let me take you back to the main menu.',
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

    const sectionName = section.about_name;
    const sectionContent = section.description;

    // Format and display the section content (without repeating the section name)
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: sectionContent,
      ts: Date.now(),
    });

    // Generate dynamic navigation quick replies
    const quickReplies: Array<{ label: string; value: string; next: string }> =
      [];

    // Fetch all available sections for navigation (excluding current section)
    const { data: allSections, error: sectionsError } = await supabase
      .from('about_bj_santiago')
      .select('about_id, about_name, display_order')
      .neq('about_id', aboutId) // Exclude current section
      .order('display_order', { ascending: true });

    if (!sectionsError && allSections && allSections.length > 0) {
      // Add other sections as navigation options
      allSections.forEach(section => {
        quickReplies.push({
          label: section.about_name,
          value: `${section.about_id}|${section.about_name}`,
          next: 'about_dynamic',
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
    console.error('[displayAboutContent] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading the section content. Please try again.',
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