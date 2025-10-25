/**
 * Action handler: display_service_categories
 *
 * Displays all active service categories as quick replies for category selection.
 * This provides a dynamic menu that automatically updates when admins add/edit/delete categories.
 *
 * @description
 * - Queries service_categories table for active categories
 * - Orders by display_order ASC for consistent menu ordering
 * - Generates quick replies for each active category
 * - Each quick reply navigates to category_dynamic node with category info stored in context
 * - Includes "End Chat" option
 * - Reusable for both customer and guest flows
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer ID (may be null for guest flows)
 *
 * @returns ActionExecutionResult with dynamic quick replies for category selection
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "welcome",
 *   "type": "action",
 *   "action": "display_service_categories",
 *   "action_config": {}
 * }
 * ```
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayServiceCategories(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    console.log('[displayServiceCategories] Starting to fetch categories...');
    
    // Query active service categories ordered by display_order
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('category_id, category_name, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    console.log('[displayServiceCategories] Query result:', { categories, error });

    if (error) {
      console.error('[displayServiceCategories] Error fetching categories:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading our service categories. Please try again.',
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
      text: "Hi! I'm Printy, B.J. Santiago's bot assistant. Here you can browse all our active printing services organized by category. What would you like to explore?",
      ts: Date.now(),
    });

    const quickReplies: Array<{ label: string; value: string; next: string }> = [];

    console.log('[displayServiceCategories] Processing categories:', categories);

    if (categories && categories.length > 0) {
      console.log('[displayServiceCategories] Found', categories.length, 'active categories');
      
      // Generate quick replies for each active category
      categories.forEach(category => {
        console.log('[displayServiceCategories] Adding category:', category.category_name);
        quickReplies.push({
          label: category.category_name,
          value: `${category.category_id}|${category.category_name}`,
          next: 'category_dynamic',
        });
      });

      // Add "End Chat" option
      quickReplies.push({
        label: 'End Chat',
        value: 'end',
        next: 'end',
      });
    } else {
      console.log('[displayServiceCategories] No active categories found');
      
      // No active categories found
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No service categories are available at the moment. Please check back later or contact us directly.',
        ts: Date.now(),
      });

      quickReplies.push({
        label: 'End Chat',
        value: 'end',
        next: 'end',
      });
    }

    console.log('[displayServiceCategories] Final quick replies:', quickReplies);

    return {
      messages,
      quickReplies,
    };
  } catch (error) {
    console.error('[displayServiceCategories] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading our service categories. Please try again.',
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
