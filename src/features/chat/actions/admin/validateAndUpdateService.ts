/**
 * Action handler: validate_and_update_service
 *
 * Validates and updates service name or status in the database.
 * This action is used in the admin-update-service flow when admin chooses to update
 * service name or status.
 *
 * @description
 * - Validates that the new value is provided and not empty
 * - For service name: Checks if name already exists in the same category (case-insensitive)
 * - For status: Validates that status is one of: active, inactive, retired
 * - Updates the service in the database with updated_by set to admin user ID
 * - Updates updated_at timestamp automatically via database trigger
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing service_id, new_service_name or new_service_status
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

export async function validateAndUpdateService(
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
    const config = params.actionNode?.action_config as any;
    const updateField = config?.update_field; // 'service_name' or 'status'

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

    if (!updateField) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Update field configuration is missing. Please contact support.',
        ts: Date.now(),
      });
      return {
        messages,
      };
    }

    // Get admin user ID
    const adminUserId = await getAdminUserId();

    if (updateField === 'service_name') {
      const newServiceName = String(context.new_service_name || '').trim();

      // Validate service name
      if (!newServiceName || newServiceName.length === 0) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Service name cannot be empty. Please provide a valid service name.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Check minimum length
      if (newServiceName.length < 2) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Service name must be at least 2 characters long. Please provide a longer name.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Get current service to check category_id
      const { data: currentService, error: fetchError } = await supabase
        .from('printing_services')
        .select('service_name, category_id')
        .eq('service_id', serviceId)
        .single();

      if (fetchError || !currentService) {
        console.error(
          '[validateAndUpdateService] Error fetching current service:',
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

      // Skip duplicate check if the name is the same (case-insensitive)
      if (
        currentService.service_name.toLowerCase() ===
        newServiceName.toLowerCase()
      ) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `The service name is already "${newServiceName}". No changes needed.`,
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Check if service name already exists in the same category (case-insensitive)
      const { data: existingService, error: checkError } = await supabase
        .from('printing_services')
        .select('service_id, service_name, category_id')
        .eq('category_id', currentService.category_id)
        .ilike('service_name', newServiceName)
        .neq('service_id', serviceId) // Exclude current service
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected
        console.error(
          '[validateAndUpdateService] Error checking existing service:',
          checkError
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'An error occurred while validating the service name. Please try again.',
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
          text: `A service with the name "${newServiceName}" already exists in this category. Please choose a different name.`,
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Update the service name
      const { data: updatedService, error: updateError } = await supabase
        .from('printing_services')
        .update({
          service_name: newServiceName,
          updated_by: adminUserId,
        })
        .eq('service_id', serviceId)
        .select('service_id, service_name, display_id')
        .single();

      if (updateError) {
        console.error(
          '[validateAndUpdateService] Error updating service name:',
          updateError
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Failed to update the service name. Please try again.',
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
        text: `Service name has been updated successfully to "${newServiceName}"!\nService ID: ${updatedService.display_id || updatedService.service_id}`,
        ts: Date.now(),
      });

      // Update context with new service name
      return {
        messages,
        context: {
          service_name: newServiceName,
        },
      };
    } else if (updateField === 'status') {
      const newStatus = String(context.new_service_status || '')
        .trim()
        .toLowerCase();

      // Validate status
      const validStatuses = ['active', 'inactive', 'retired'];
      if (!validStatuses.includes(newStatus)) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Invalid status. Status must be one of: ${validStatuses.join(', ')}.`,
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Get current service to check current status
      const { data: currentService, error: fetchError } = await supabase
        .from('printing_services')
        .select('status, display_id')
        .eq('service_id', serviceId)
        .single();

      if (fetchError || !currentService) {
        console.error(
          '[validateAndUpdateService] Error fetching current service:',
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

      // Skip update if status is the same
      if (currentService.status.toLowerCase() === newStatus) {
        const statusDisplay =
          newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `The service status is already "${statusDisplay}". No changes needed.`,
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Update the service status
      const { data: updatedService, error: updateError } = await supabase
        .from('printing_services')
        .update({
          status: newStatus,
          updated_by: adminUserId,
        })
        .eq('service_id', serviceId)
        .select('service_id, status, display_id')
        .single();

      if (updateError) {
        console.error(
          '[validateAndUpdateService] Error updating service status:',
          updateError
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Failed to update the service status. Please try again.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Success message
      const statusDisplay =
        newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `Service status has been updated successfully to "${statusDisplay}"!\nService ID: ${updatedService.display_id || updatedService.service_id}`,
        ts: Date.now(),
      });

      // Update context with new status
      return {
        messages,
        context: {
          service_status: newStatus,
        },
      };
    } else if (updateField === 'description') {
      const newDescription = String(
        context.new_service_description || ''
      ).trim();

      // Description can be empty (optional field), but if provided, validate length
      if (newDescription.length > 0 && newDescription.length < 3) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Service description must be at least 3 characters long if provided. Please provide a longer description or leave it empty.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Get current service to check current description
      const { data: currentService, error: fetchError } = await supabase
        .from('printing_services')
        .select('description, display_id')
        .eq('service_id', serviceId)
        .single();

      if (fetchError || !currentService) {
        console.error(
          '[validateAndUpdateService] Error fetching current service:',
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

      // Skip update if description is the same
      const currentDesc = currentService.description || '';
      if (currentDesc === newDescription) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: newDescription
            ? `The service description is already set to "${newDescription}". No changes needed.`
            : 'The service description is already empty. No changes needed.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Update the service description
      const updateData: any = {
        updated_by: adminUserId,
      };

      // Set description to null if empty, otherwise set to new description
      if (newDescription.length === 0) {
        updateData.description = null;
      } else {
        updateData.description = newDescription;
      }

      const { data: updatedService, error: updateError } = await supabase
        .from('printing_services')
        .update(updateData)
        .eq('service_id', serviceId)
        .select('service_id, description, display_id')
        .single();

      if (updateError) {
        console.error(
          '[validateAndUpdateService] Error updating service description:',
          updateError
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Failed to update the service description. Please try again.',
          ts: Date.now(),
        });
        return {
          messages,
        };
      }

      // Success message
      if (newDescription.length === 0) {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Service description has been cleared successfully!\nService ID: ${updatedService.display_id || updatedService.service_id}`,
          ts: Date.now(),
        });
      } else {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Service description has been updated successfully!\nService ID: ${updatedService.display_id || updatedService.service_id}`,
          ts: Date.now(),
        });
      }

      // Update context with new description
      return {
        messages,
        context: {
          service_description: newDescription || null,
        },
      };
    } else {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `Unknown update field: ${updateField}. Please contact support.`,
        ts: Date.now(),
      });
      return {
        messages,
      };
    }
  } catch (error) {
    console.error('[validateAndUpdateService] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An unexpected error occurred while updating the service. Please try again.',
      ts: Date.now(),
    });
    return {
      messages,
    };
  }
}
