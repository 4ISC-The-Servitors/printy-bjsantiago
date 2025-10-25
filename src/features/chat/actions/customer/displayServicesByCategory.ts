/**
 * Action handler: display_services_by_category
 *
 * Displays active services for a selected category with dynamic navigation options.
 * This provides real-time service listings that automatically update when admins modify services.
 *
 * @description
 * - Reads category information from session context (set by quick reply selection)
 * - Queries printing_services table joined with service_categories
 * - Filters by status = 'active' and matching category
 * - Formats services as bullet-point list: • Service Name - Description
 * - Generates dynamic navigation quick replies for all active categories
 * - Reusable for both customer and guest flows
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing selected category info
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer ID (may be null for guest flows)
 *
 * @returns ActionExecutionResult with formatted service list and navigation options
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "category_dynamic",
 *   "type": "action",
 *   "action": "display_services_by_category",
 *   "action_config": {
 *     "category_source": "context"
 *   }
 * }
 * ```
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayServicesByCategory(
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
    // Get category information from context
    // The quick reply value format is "category_id|category_name"
    const selectedCategory = context?.selected_category;
    
    if (!selectedCategory) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No category selected. Let me take you back to the main menu.',
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

    const [categoryId, categoryName] = selectedCategory.split('|');
    
    if (!categoryId || !categoryName) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Invalid category selection. Let me take you back to the main menu.',
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

    // Query active services for the selected category
    const { data: services, error: servicesError } = await supabase
      .from('printing_services')
      .select(`
        service_id,
        display_id,
        service_name,
        description,
        status,
        service_categories!inner(
          category_id,
          category_name
        )
      `)
      .eq('status', 'active')
      .eq('category_id', categoryId)
      .order('service_name', { ascending: true });

    if (servicesError) {
      console.error('[displayServicesByCategory] Error fetching services:', servicesError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading the services for this category. Please try again.',
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

    // Format services as bullet-point list
    let serviceList = `${categoryName}:\n\n`;
    
    if (services && services.length > 0) {
      services.forEach(service => {
        const description = service.description ? ` - ${service.description}` : '';
        serviceList += `• ${service.service_name}${description}\n`;
      });
    } else {
      serviceList += 'No active services available in this category at the moment.';
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: serviceList,
      ts: Date.now(),
    });

    // Generate dynamic navigation quick replies
    const quickReplies: Array<{ label: string; value: string; next: string }> = [];

    // Fetch all active categories for navigation (excluding current category)
    const { data: allCategories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('category_id, category_name')
      .eq('is_active', true)
      .neq('category_id', categoryId) // Exclude current category
      .order('display_order', { ascending: true });

    if (!categoriesError && allCategories && allCategories.length > 0) {
      // Add other categories as navigation options
      allCategories.forEach(category => {
        quickReplies.push({
          label: category.category_name,
          value: `${category.category_id}|${category.category_name}`,
          next: 'category_dynamic',
        });
      });
    }

    // Add standard navigation options
    quickReplies.push(
      {
        label: 'Back to Main Menu',
        value: 'main',
        next: 'welcome',
      },
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
    console.error('[displayServicesByCategory] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading the services. Please try again.',
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
}
