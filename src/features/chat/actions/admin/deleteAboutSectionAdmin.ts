/**
 * Action handler: delete_about_section_admin
 *
 * Permanently removes a selected About section.
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function deleteAboutSectionAdmin(
  params: ActionExecutionParams
) : Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const config = params.actionNode?.action_config as Record<string, any>;
    const aboutIdKey = config?.about_id_key || 'selected_about_id';

    const rawValue = params.context?.[aboutIdKey];
    const aboutIdCandidate =
      typeof rawValue === 'string'
        ? rawValue
        : rawValue !== undefined && rawValue !== null
          ? String(rawValue)
          : '';
    const aboutId = aboutIdCandidate.split('|')[0]?.trim();

    if (!aboutId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not identify which section to delete. Please select a section again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const { data, error } = await supabase
      .from('about_bj_santiago')
      .delete()
      .eq('about_id', aboutId)
      .select('about_name')
      .maybeSingle();

    if (error) {
      console.error('[deleteAboutSectionAdmin] Error deleting section:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I was unable to delete that section. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Section "${data?.about_name || 'About section'}" has been removed.`,
      ts: Date.now(),
    });

    return {
      messages,
      context: {
        deleted_about_id: aboutId,
        selected_about_id: null,
      },
    };
  } catch (error) {
    console.error('[deleteAboutSectionAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while deleting the section. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}

