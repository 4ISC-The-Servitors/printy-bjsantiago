/**
 * Action handler: validate_and_change_service_category
 *
 * Validates and changes which category a service belongs to by updating the service's category_id.
 * This action is used in the admin-update-service flow when admin chooses to move a service
 * to a different existing category.
 *
 * @description
 * - Validates that the new category_id is provided
 * - Verifies that the new category exists
 * - Checks if service name already exists in the target category (case-insensitive)
 * - Updates the service's category_id to move it to the new category
 * - Updates updated_by and updated_at fields
 * - Only affects the specific service being updated
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing service_id, new_category_id
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

export async function validateAndChangeServiceCategory(
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
    const serviceId = context.service_id;
    // Get category_id from context - could be from quick reply (selected_category) or direct (new_category_id)
    const newCategoryId =
      context.new_category_id ||
      context.selected_category ||
      context.category_id;

    if (!serviceId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Service information is missing. Please try again from the portfolio page.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    if (!newCategoryId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Category selection is missing. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Get current service to check current category and service name
    const { data: currentService, error: fetchError } = await supabase
      .from('printing_services')
      .select('service_id, service_name, category_id, display_id')
      .eq('service_id', serviceId)
      .single();

    if (fetchError || !currentService) {
      console.error(
        '[validateAndChangeServiceCategory] Error fetching current service:',
        fetchError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Service not found. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Skip if already in the target category
    if (currentService.category_id === newCategoryId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'The service is already in this category. No changes needed.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Verify that the target category exists
    const { data: targetCategory, error: categoryError } = await supabase
      .from('service_categories')
      .select('category_id, category_name')
      .eq('category_id', newCategoryId)
      .single();

    if (categoryError || !targetCategory) {
      console.error(
        '[validateAndChangeServiceCategory] Error fetching target category:',
        categoryError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Target category not found. Please try selecting a category again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Check if a service with the same name already exists in the target category (case-insensitive)
    const { data: existingService, error: checkError } = await supabase
      .from('printing_services')
      .select('service_id, service_name, category_id')
      .eq('category_id', newCategoryId)
      .ilike('service_name', currentService.service_name)
      .neq('service_id', serviceId) // Exclude current service
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error(
        '[validateAndChangeServiceCategory] Error checking existing service:',
        checkError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'An error occurred while validating the service. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    if (existingService) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `A service with the name "${currentService.service_name}" already exists in "${targetCategory.category_name}". Please rename the service first or choose a different category.`,
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Get admin user ID
    const adminUserId = await getAdminUserId();

    // Update the service's category_id to move it to the new category
    const { data: updatedService, error: updateError } = await supabase
      .from('printing_services')
      .update({
        category_id: newCategoryId,
        updated_by: adminUserId,
      })
      .eq('service_id', serviceId)
      .select(
        'service_id, service_name, display_id, category_id, category:service_categories(category_id, category_name)'
      )
      .single();

    if (updateError) {
      console.error(
        '[validateAndChangeServiceCategory] Error updating service category:',
        updateError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to move the service to the new category. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Extract category name for success message
    const category = Array.isArray(updatedService.category)
      ? updatedService.category[0]
      : updatedService.category;
    const categoryName =
      category?.category_name || targetCategory.category_name;

    // Success message
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Service "${currentService.service_name}" has been successfully moved to category "${categoryName}"!\nService ID: ${updatedService.display_id || updatedService.service_id}`,
      ts: Date.now(),
    });

    // Update context with new category information
    return {
      messages,
      context: {
        category_id: newCategoryId,
        category_name: categoryName,
      },
    };
  } catch (error) {
    console.error(
      '[validateAndChangeServiceCategory] Unexpected error:',
      error
    );
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An unexpected error occurred while changing the service category. Please try again.',
      ts: Date.now(),
    });
    return {
      messages,
    };
  }
}
