/**
 * Action handler: display_about_sections_admin
 *
 * Lists all About B.J. Santiago sections so admins can pick one to edit or delete.
 * Each section is rendered as a quick reply (value: about_id|about_name) and stores
 * the selection in `selected_about_id` for downstream nodes.
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayAboutSectionsAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const { data, error } = await supabase
      .from('about_bj_santiago')
      .select('about_id, about_name, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(
        '[displayAboutSectionsAdmin] Error fetching sections:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I ran into an issue loading the About sections. Please try again.',
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

    const config = params.actionNode?.action_config as Record<string, any>;
    const promptMessage =
      config?.message ||
      'Select the About section you want to review or update.';
    const emptyMessage =
      config?.empty_message ||
      'There are no About sections yet. Use Add Section to create one.';
    const nextNode = config?.next_node || 'choose_edit_action';
    const emptyNext = config?.empty_next_node || 'add_section_name';

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
            label: 'Add Section',
            value: 'add_section',
            next: emptyNext,
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

    const quickReplies = data.map(section => ({
      label: section.about_name,
      value: `${section.about_id}|${section.about_name}`,
      next: nextNode,
      store_as: 'selected_about_id',
    }));

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error(
      '[displayAboutSectionsAdmin] Unexpected error loading sections:',
      error
    );
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading the sections. Please try again.',
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

