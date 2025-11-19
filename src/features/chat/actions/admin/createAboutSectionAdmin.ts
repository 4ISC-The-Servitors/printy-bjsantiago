/**
 * Action handler: create_about_section_admin
 *
 * Persists a new About B.J. Santiago section using values captured from the flow.
 */

import { supabase } from '@lib/supabase';
import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function createAboutSectionAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: ActionExecutionResult['messages'] = [];

  try {
    const config = params.actionNode?.action_config as Record<string, any>;
    const nameKey = config?.name_key || 'about_name';
    const descriptionKey = config?.description_key || 'about_description';

    const rawName = params.context?.[nameKey];
    const rawDescription = params.context?.[descriptionKey];

    const aboutName =
      typeof rawName === 'string' ? rawName.trim() : String(rawName || '').trim();
    const description =
      rawDescription === undefined || rawDescription === null
        ? ''
        : typeof rawDescription === 'string'
          ? rawDescription.trim()
          : String(rawDescription).trim();

    if (!aboutName) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Section name cannot be empty. Please provide a valid name.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Optional deduplication (case-insensitive)
    const { data: existingSection, error: lookupError } = await supabase
      .from('about_bj_santiago')
      .select('about_id')
      .ilike('about_name', aboutName)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error(
        '[createAboutSectionAdmin] Error checking existing section:',
        lookupError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I could not validate the section name. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (existingSection) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `A section named "${aboutName}" already exists. Please use a different title.`,
        ts: Date.now(),
      });
      return { messages };
    }

    const adminUserId = await getAdminUserId();
    const { data, error } = await supabase
      .from('about_bj_santiago')
      .insert({
        about_name: aboutName,
        description: description || null,
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .select('about_id, about_name')
      .single();

    if (error) {
      console.error(
        '[createAboutSectionAdmin] Error creating section:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I was unable to save the new section. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Section "${aboutName}" has been added successfully.`,
      ts: Date.now(),
    });

    return {
      messages,
      context: data
        ? {
            created_about_id: data.about_id,
            selected_about_id: data.about_id,
          }
        : undefined,
    };
  } catch (error) {
    console.error('[createAboutSectionAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while creating the section. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}

