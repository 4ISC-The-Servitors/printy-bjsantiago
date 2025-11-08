/**
 * Action handler: validate_and_update_category
 *
 * Validates and updates category name in the database.
 * This action is used in the admin-update-service flow when admin chooses to update
 * the category name for the service's category.
 *
 * @description
 * - Validates that the new category name is provided and not empty
 * - Checks if category name already exists (case-insensitive)
 * - Updates the category in the database with updated_by set to admin user ID
 * - Updates updated_at timestamp automatically via database trigger
 * - Note: This updates the category that the current service belongs to
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing service_id, category_id, and new_category_name
 * @param params.sessionId - Current chat session ID
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

export async function validateAndUpdateCategory(
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
    const categoryId = context.category_id;
    const config = params.actionNode?.action_config as any;
    const updateField = config?.update_field; // 'category_name' or 'description'
    const newCategoryName = String(context.new_category_name || '').trim();
    const newCategoryDescription = String(
      context.new_category_description || ''
    ).trim();

    if (!categoryId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Category information is missing. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Determine which field to update (default to category_name if not specified)
    const fieldToUpdate = updateField || 'category_name';

    if (fieldToUpdate === 'description') {
      // Handle description update
      // Description can be empty (optional field), but if provided, validate length
      if (
        newCategoryDescription.length > 0 &&
        newCategoryDescription.length < 3
      ) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Category description must be at least 3 characters long if provided. Please provide a longer description or leave it empty.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Get current category to check current description
      const { data: currentCategory, error: fetchError } = await supabase
        .from('service_categories')
        .select('category_id, description, category_name')
        .eq('category_id', categoryId)
        .single();

      if (fetchError || !currentCategory) {
        console.error(
          '[validateAndUpdateCategory] Error fetching current category:',
          fetchError
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Category not found. Please try again.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Skip update if description is the same
      const currentDesc = currentCategory.description || '';
      if (currentDesc === newCategoryDescription) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: newCategoryDescription
            ? `The category description is already set to "${newCategoryDescription}". No changes needed.`
            : 'The category description is already empty. No changes needed.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Get admin user ID for audit tracking
      const adminUserId = await getAdminUserId();

      // Update the category description
      const updateData: any = {
        updated_by: adminUserId,
      };

      // Set description to null if empty, otherwise set to new description
      if (newCategoryDescription.length === 0) {
        updateData.description = null;
      } else {
        updateData.description = newCategoryDescription;
      }

      const { data: updatedCategory, error: updateError } = await supabase
        .from('service_categories')
        .update(updateData)
        .eq('category_id', categoryId)
        .select('category_id, description, category_name')
        .single();

      if (updateError) {
        console.error(
          '[validateAndUpdateCategory] Error updating category description:',
          updateError
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Failed to update the category description. Please try again.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Success message
      if (newCategoryDescription.length === 0) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Category description has been cleared successfully for "${updatedCategory.category_name}"!`,
          ts: Date.now(),
        });
      } else {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Category description has been updated successfully for "${updatedCategory.category_name}"!`,
          ts: Date.now(),
        });
      }

      // Update context with new description
      return {
        messages,
        context: {
          category_description: newCategoryDescription || null,
        },
      };
    }

    // Handle category name update (existing logic)
    // Validate category name
    if (!newCategoryName || newCategoryName.length === 0) {
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
    if (newCategoryName.length < 2) {
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

    // Get current category to check current name
    const { data: currentCategory, error: fetchError } = await supabase
      .from('service_categories')
      .select('category_id, category_name')
      .eq('category_id', categoryId)
      .single();

    if (fetchError || !currentCategory) {
      console.error(
        '[validateAndUpdateCategory] Error fetching current category:',
        fetchError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Category not found. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Skip duplicate check if the name is the same (case-insensitive)
    if (
      currentCategory.category_name.toLowerCase() ===
      newCategoryName.toLowerCase()
    ) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `The category name is already "${newCategoryName}". No changes needed.`,
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
      .ilike('category_name', newCategoryName)
      .neq('category_id', categoryId) // Exclude current category
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error(
        '[validateAndUpdateCategory] Error checking existing category:',
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
        text: `A category with the name "${newCategoryName}" already exists. Please choose a different name.`,
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Get admin user ID for audit tracking
    const adminUserId = await getAdminUserId();

    // Update the category name
    const updateData: any = {
      category_name: newCategoryName,
      updated_by: adminUserId,
    };

    const { data: updatedCategory, error: updateError } = await supabase
      .from('service_categories')
      .update(updateData)
      .eq('category_id', categoryId)
      .select('category_id, category_name')
      .single();

    if (updateError) {
      console.error(
        '[validateAndUpdateCategory] Error updating category name:',
        updateError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to update the category name. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Success message
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Category name has been updated successfully to "${updatedCategory.category_name}"!`,
      ts: Date.now(),
    });

    // Update context with new category name
    return {
      messages,
      context: {
        category_name: updatedCategory.category_name,
      },
    };
  } catch (error) {
    console.error('[validateAndUpdateCategory] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An unexpected error occurred while updating the category. Please try again.',
      ts: Date.now(),
    });
    return {
      messages,
    };
  }
}
