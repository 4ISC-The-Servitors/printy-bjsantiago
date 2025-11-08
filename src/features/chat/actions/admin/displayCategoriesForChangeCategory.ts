/**
 * Action handler: display_categories_for_change_category
 *
 * Displays all existing service categories (excluding the current category) as quick replies.
 * This is used in the admin-update-service flow when admin chooses to move a service
 * to a different category.
 *
 * @description
 * - Fetches ALL categories (both active and inactive) ordered by display_order
 * - Excludes the current category that the service belongs to
 * - Generates quick replies for each category with status indicator
 * - Each quick reply routes to change_service_category action
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing service_id and category_id
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

export async function displayCategoriesForChangeCategory(
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
    const currentCategoryId = context.category_id;

    if (!currentCategoryId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Category information is missing. Please try again.',
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

    console.log(
      '[displayCategoriesForChangeCategory] Fetching categories (excluding:',
      currentCategoryId,
      ')'
    );

    // Query ALL service categories (both active and inactive) ordered by display_order
    // Exclude the current category
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('category_id, category_name, description, is_active')
      .neq('category_id', currentCategoryId)
      .order('display_order', { ascending: true });

    console.log('[displayCategoriesForChangeCategory] Query result:', {
      categories,
      error,
    });

    if (error) {
      console.error(
        '[displayCategoriesForChangeCategory] Error fetching categories:',
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
            next: 'ask_new_category',
          },
        ],
      };
    }

    // Add message asking which category to move to
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Which category would you like to move this service to?',
      ts: Date.now(),
    });

    const quickReplies: Array<{
      label: string;
      value: string;
      next: string;
    }> = [];

    console.log(
      '[displayCategoriesForChangeCategory] Processing categories:',
      categories
    );

    // Generate quick replies for each category (excluding current category)
    if (categories && categories.length > 0) {
      console.log(
        '[displayCategoriesForChangeCategory] Found',
        categories.length,
        'categories'
      );

      categories.forEach(category => {
        const statusLabel = category.is_active ? '' : ' (Inactive)';
        console.log(
          '[displayCategoriesForChangeCategory] Adding category:',
          category.category_name
        );
        // Store category_id and category_name in value for later parsing
        quickReplies.push({
          label: `${category.category_name}${statusLabel}`,
          value: `${category.category_id}|${category.category_name}`,
          next: 'change_service_category',
        });
      });
    } else {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No other categories available. You would need to create a new category first.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Back',
            value: 'back',
            next: 'greet',
          },
        ],
      };
    }

    console.log(
      '[displayCategoriesForChangeCategory] Final quick replies:',
      quickReplies
    );

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error(
      '[displayCategoriesForChangeCategory] Unexpected error:',
      error
    );
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
          next: 'ask_new_category',
        },
      ],
    };
  }
}
