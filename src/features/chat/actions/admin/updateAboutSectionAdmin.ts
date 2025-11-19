/**
 * Action handler: update_about_section_admin
 *
 * Updates an existing About section (name, description, or both).
 */

import { supabase } from '@lib/supabase';
import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function updateAboutSectionAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const config = params.actionNode?.action_config as Record<string, any>;
    const aboutIdKey = config?.about_id_key || 'selected_about_id';
    const nameKey = config?.name_key || 'updated_about_name';
    const descriptionKey =
      config?.description_key || 'updated_about_description';

    const rawAboutId = params.context?.[aboutIdKey];
    const aboutIdCandidate =
      typeof rawAboutId === 'string'
        ? rawAboutId
        : rawAboutId !== undefined && rawAboutId !== null
          ? String(rawAboutId)
          : '';
    const aboutId = aboutIdCandidate.split('|')[0]?.trim();

    if (!aboutId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I was unable to determine which section to update. Please select a section again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const updates: Record<string, any> = {};

    const rawName = params.context?.[nameKey];
    if (rawName !== undefined && rawName !== null) {
      const name = String(rawName).trim();
      if (!name) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'The new name cannot be empty. Please provide a valid title.',
          ts: Date.now(),
        });
        return { messages };
      }
      updates.about_name = name;
    }

    const rawDescription = params.context?.[descriptionKey];
    if (rawDescription !== undefined && rawDescription !== null) {
      const desc = String(rawDescription).trim();
      updates.description = desc || null;
    }

    if (Object.keys(updates).length === 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No changes were provided. Please enter a new name or description.',
        ts: Date.now(),
      });
      return { messages };
    }

    const adminUserId = await getAdminUserId();
    updates.updated_by = adminUserId;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('about_bj_santiago')
      .update(updates)
      .eq('about_id', aboutId);

    if (error) {
      console.error('[updateAboutSectionAdmin] Error updating section:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not apply the changes. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'The section has been updated successfully.',
      ts: Date.now(),
    });

    return {
      messages,
      context: {
        selected_about_id: aboutId,
      },
    };
  } catch (error) {
    console.error('[updateAboutSectionAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while updating the section. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}

