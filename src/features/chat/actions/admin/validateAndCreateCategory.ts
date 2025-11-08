/**
 * Action handler: validate_and_create_category
 *
 * Validates a category name and creates a new service category in the database.
 * This action is used in the admin-add-service flow when admin chooses to create a new category.
 *
 * @description
 * - Validates that category name is provided and not empty
 * - Checks if category name already exists (case-insensitive)
 * - Creates new category with status ACTIVE (categories are active by default)
 * - Sets created_by to admin user ID
 * - Optionally sets description if provided in context
 * - Note: This action is part of the service creation flow - category is created
 *   and the flow immediately continues to service creation
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing category_name and optionally description
 * @param params.customerId - Admin user ID (from session)
 *
 * @returns ActionExecutionResult with success/error message
 */

import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function validateAndCreateCategory(
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
    const categoryName = String(context.category_name || '').trim();

    // Validate category name
    if (!categoryName || categoryName.length === 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Category name cannot be empty. Please provide a valid category name.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Check minimum length
    if (categoryName.length < 2) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Category name must be at least 2 characters long. Please provide a longer name.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Check if category name already exists (case-insensitive)
    const { data: existingCategory, error: checkError } = await supabase
      .from('service_categories')
      .select('category_id, category_name')
      .ilike('category_name', categoryName)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error(
        '[validateAndCreateCategory] Error checking existing category:',
        checkError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'An error occurred while validating the category name. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    if (existingCategory) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `A category with the name "${categoryName}" already exists. Please choose a different name.`,
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Get admin user ID
    const adminUserId = await getAdminUserId();

    // Get description from context (optional)
    // Check action_config for description_key, otherwise use default 'description'
    const config = params.actionNode?.action_config as any;
    const descriptionKey = config?.description_key || 'description';
    const descriptionValue = context[descriptionKey] || context.description;
    const description = descriptionValue
      ? String(descriptionValue).trim()
      : null;

    // Get the maximum display_order to increment for the new category
    // This ensures proper ordering for quick replies in services-offered flow
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('service_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxOrderError && maxOrderError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if no categories exist
      console.error(
        '[validateAndCreateCategory] Error fetching max display_order:',
        maxOrderError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'An error occurred while preparing to create the category. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Calculate the next display_order (increment from max, or start at 0 if no categories exist)
    const nextDisplayOrder =
      maxOrderData?.display_order != null ? maxOrderData.display_order + 1 : 0;

    // Create the category with status ACTIVE (categories are active by default)
    const { data: newCategory, error: insertError } = await supabase
      .from('service_categories')
      .insert({
        category_name: categoryName,
        description: description || null,
        is_active: true, // Set to ACTIVE for new categories
        display_order: nextDisplayOrder, // Set display_order to maintain proper ordering
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .select('category_id, category_name')
      .single();

    if (insertError) {
      console.error(
        '[validateAndCreateCategory] Error creating category:',
        insertError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to create the category. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Success message
    const descriptionText = description ? `\nDescription: ${description}` : '';
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Category "${categoryName}" has been created successfully!${descriptionText}\n\nNow let's add a service to this category.`,
      ts: Date.now(),
    });

    // Store category_id in context for creating service in this category
    return {
      messages,
      context: {
        created_category_id: newCategory.category_id,
        created_category_name: newCategory.category_name,
        selected_category: newCategory.category_id, // Store for service creation
        category_id: newCategory.category_id, // Also store as category_id for consistency
      },
    };
  } catch (error) {
    console.error('[validateAndCreateCategory] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An unexpected error occurred while creating the category. Please try again.',
      ts: Date.now(),
    });
    return {
      messages,
    };
  }
}
