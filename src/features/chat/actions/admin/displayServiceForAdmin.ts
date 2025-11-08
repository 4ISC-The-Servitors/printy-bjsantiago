/**
 * Action handler: display_service_for_admin
 *
 * Displays the current service information including name, status, category, and description.
 * This action is used at the start of the admin-update-service flow to show what service
 * is being updated.
 *
 * @description
 * - Fetches service data using service_id from context
 * - Displays service name, display_id, status, category name, and description
 * - Shows error message if service_id is missing or service not found
 * - Stores service data in context for later use in update actions
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing service_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Admin user ID (from session)
 *
 * @returns ActionExecutionResult with service information message and quick replies
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayServiceForAdmin(
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

    if (!serviceId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Service information is missing. Please try again from the portfolio page.',
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

    // Fetch service with category information
    const { data: service, error: serviceError } = await supabase
      .from('printing_services')
      .select(
        `
        service_id,
        display_id,
        service_name,
        status,
        description,
        category_id,
        category:service_categories(category_id, category_name, description)
      `
      )
      .eq('service_id', serviceId)
      .single();

    if (serviceError || !service) {
      console.error(
        '[displayServiceForAdmin] Error fetching service:',
        serviceError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Service not found. Please try again from the portfolio page.',
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

    // Extract category information
    const category = Array.isArray(service.category)
      ? service.category[0]
      : service.category;
    const categoryName = category?.category_name || 'Unknown Category';
    const categoryDescription = category?.description || null;

    // Format status for display
    const statusDisplay = service.status
      ? service.status.charAt(0).toUpperCase() + service.status.slice(1)
      : 'Unknown';

    // Build service information message
    let serviceInfo = `Here are the current details for this service:\n\n`;
    serviceInfo += `Service ID: ${service.display_id || service.service_id}\n`;
    serviceInfo += `Service Name: ${service.service_name}\n`;
    serviceInfo += `Status: ${statusDisplay}\n`;
    serviceInfo += `Category: ${categoryName}\n`;
    if (service.description) {
      serviceInfo += `Service Description: ${service.description}\n`;
    }
    if (categoryDescription) {
      serviceInfo += `Category Description: ${categoryDescription}\n`;
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: serviceInfo,
      ts: Date.now(),
    });

    // Store service and category data in context for update actions
    return {
      messages,
      context: {
        service_id: service.service_id,
        service_name: service.service_name,
        service_status: service.status,
        category_id: service.category_id,
        category_name: categoryName,
        ...(service.description && {
          service_description: service.description,
        }),
        ...(categoryDescription && {
          category_description: categoryDescription,
        }),
      },
      quickReplies: [
        {
          label: 'Update Service Name',
          value: 'update_service_name',
          next: 'ask_service_name',
        },
        {
          label: 'Update Service Status',
          value: 'update_service_status',
          next: 'ask_service_status',
        },
        {
          label: 'Change Service Category',
          value: 'change_service_category',
          next: 'ask_new_category',
        },
        {
          label: 'Update Service Description',
          value: 'update_service_description',
          next: 'ask_service_description',
        },
        {
          label: 'Rename Category (affects all services)',
          value: 'update_category_name',
          next: 'ask_category_name',
        },
        {
          label: 'Update Category Description',
          value: 'update_category_description',
          next: 'ask_category_description',
        },
        {
          label: 'End Chat',
          value: 'done',
          next: 'end',
        },
      ],
    };
  } catch (error) {
    console.error('[displayServiceForAdmin] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An unexpected error occurred while loading the service information. Please try again.',
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
}
