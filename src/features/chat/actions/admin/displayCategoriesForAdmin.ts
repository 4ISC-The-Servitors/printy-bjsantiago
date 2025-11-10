/**
 * Action handler: display_categories_for_admin
 *
 * Displays all existing service categories as quick replies, plus a "Create New Category" option.
 * This is used in the admin-add-service flow to allow admins to either select an existing category
 * or create a new one.
 *
 * @description
 * - Reuses the same query pattern as displayServiceCategories but fetches ALL categories (active and inactive)
 * - Orders by display_order ASC for consistent menu ordering
 * - Generates quick replies for each category with status indicator
 * - Adds "Create New Category" option at the end
 * - Each quick reply stores category info in context for later use
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Admin user ID (from session)
 *
 * @returns ActionExecutionResult with dynamic quick replies for category selection
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayCategoriesForAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Query ALL service categories (both active and inactive) ordered by display_order
    // This is similar to displayServiceCategories but without the is_active filter
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('category_id, category_name, description, is_active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error(
        '[displayCategoriesForAdmin] Error fetching categories:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading service categories. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Try Again',
            value: 'retry',
            next: 'ask_category',
          },
        ],
      };
    }

    // Check action config for custom message, next node, and exclude category
    const config = params.actionNode?.action_config as any;
    const customMessage =
      config?.message || 'Which category would you like to add a service to?';
    const customNextNode = config?.next_node || 'ask_service_name';
    const excludeCategoryId = config?.exclude_category_id; // For changing service category - exclude current category

    // Add message asking which category to select
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: customMessage,
      ts: Date.now(),
    });

    const quickReplies: Array<{
      label: string;
      value: string;
      next: string;
    }> = [];

    // Generate quick replies for each category (both active and inactive)
    if (categories && categories.length > 0) {
      categories.forEach(category => {
        // Skip excluded category (e.g., current category when changing service category)
        if (excludeCategoryId && category.category_id === excludeCategoryId) {
          return;
        }

        const statusLabel = category.is_active ? '' : ' (Inactive)';
        // Store category_id and category_name in value for later parsing
        // Use custom next node if provided, otherwise default to ask_service_name
        quickReplies.push({
          label: `${category.category_name}${statusLabel}`,
          value: `${category.category_id}|${category.category_name}`,
          next: customNextNode,
        });
      });
    }

    // Add "Create New Category" option
    quickReplies.push({
      label: 'Create a New Category',
      value: 'create_new_category',
      next: 'ask_category_name',
    });

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error('[displayCategoriesForAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading service categories. Please try again.',
      ts: Date.now(),
    });

    return {
      messages,
      quickReplies: [
        {
          label: 'Try Again',
          value: 'retry',
          next: 'ask_category',
        },
      ],
    };
  }
}
