/**
 * Standardized Error Handling for Chat Action Handlers
 *
 * This module provides consistent error handling patterns across all chat action handlers,
 * ensuring predictable error messages, proper logging, and uniform response formats.
 *
 * Benefits:
 * - Consistent error messages for better UX
 * - Centralized logging for easier debugging
 * - Standardized error response format
 * - Reduced code duplication across action handlers
 */

import type { ActionExecutionResult } from '@features/chat/types';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }>;
}

/**
 * Error severity levels for logging
 */
export const ErrorSeverity = {
  LOW: 'LOW', // Minor issues, user can continue
  MEDIUM: 'MEDIUM', // Important issues, may affect functionality
  HIGH: 'HIGH', // Critical issues, prevents operation
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

/**
 * Log an error with context information
 */
export function logActionError(
  _actionName: string,
  _error: unknown,
  _severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  _additionalContext?: Record<string, any>
): void {
  // Intentionally no-op to avoid noisy console output in runtime environments
}

/**
 * Create a standardized error response for action handlers
 */
export function createErrorResponse(
  userMessage: string,
  actionName?: string,
  error?: unknown,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): ErrorResponse {
  // Log the error if details are provided
  if (actionName && error) {
    logActionError(actionName, error, severity);
  }

  // Return user-friendly error message
  return {
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'printy',
        text: userMessage,
        ts: Date.now(),
      },
    ],
  };
}

/**
 * Wrap action execution with standardized error handling
 *
 * @example
 * ```typescript
 * export async function myAction(params: ActionExecutionParams): Promise<ActionExecutionResult> {
 *   return withErrorHandling('my_action', async () => {
 *     // Your action logic here
 *     const result = await doSomething();
 *     return { messages: [...] };
 *   }, 'Failed to process your request. Please try again.');
 * }
 * ```
 */
export async function withErrorHandling<T extends ActionExecutionResult>(
  actionName: string,
  actionLogic: () => Promise<T>,
  fallbackMessage: string = 'An error occurred. Please try again.',
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): Promise<T> {
  try {
    return await actionLogic();
  } catch (error) {
    logActionError(actionName, error, severity);

    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: fallbackMessage,
          ts: Date.now(),
        },
      ],
    } as T;
  }
}

/**
 * Common user-facing error messages
 * These provide consistent messaging across the application
 */
export const ErrorMessages = {
  // Generic errors
  GENERIC: 'An error occurred. Please try again.',
  TRY_AGAIN_LATER: 'Something went wrong. Please try again later.',

  // Database errors
  DATABASE_ERROR: 'Unable to access data. Please try again.',
  QUERY_FAILED: 'Failed to retrieve information. Please try again.',

  // Session errors
  SESSION_NOT_FOUND: 'Session not found. Please start a new conversation.',
  SESSION_EXPIRED: 'Your session has expired. Please start a new conversation.',

  // Quote-related errors
  QUOTE_NOT_FOUND: 'Quote not found. Please try again.',
  QUOTE_DETAILS_LOAD_FAILED: 'Error loading quote details. Please try again.',
  PROPOSAL_NOT_FOUND: 'No proposal found for this quote.',

  // Order-related errors
  ORDER_NOT_FOUND: 'Order not found. Please check your order ID and try again.',
  ORDER_LOAD_FAILED: 'Error loading order details. Please try again.',
  ORDER_VERIFICATION_FAILED: 'Unable to verify order. Please try again.',

  // Payment errors
  PAYMENT_UPLOAD_FAILED: 'Failed to upload payment proof. Please try again.',
  PAYMENT_VERIFICATION_FAILED: 'Failed to verify payment. Please try again.',

  // Input validation errors
  INVALID_INPUT: 'Invalid input. Please check your entry and try again.',
  MISSING_REQUIRED_DATA:
    'Required information is missing. Please provide all necessary details.',

  // Permission errors
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  ACCESS_DENIED:
    'Access denied. Please contact support if you believe this is an error.',
} as const;

/**
 * Validate required context fields and return error if missing
 *
 * @example
 * ```typescript
 * const error = validateRequiredContext(context, ['order_id', 'customer_id'], 'verify_order');
 * if (error) {
 *   return error;
 * }
 * ```
 */
export function validateRequiredContext(
  context: Record<string, any>,
  requiredFields: string[],
  actionName: string
): ErrorResponse | null {
  const missingFields = requiredFields.filter(field => {
    const value = context[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    logActionError(
      actionName,
      new Error('Missing required context fields'),
      ErrorSeverity.MEDIUM,
      { missingFields }
    );

    return createErrorResponse(
      ErrorMessages.MISSING_REQUIRED_DATA,
      actionName,
      undefined,
      ErrorSeverity.MEDIUM
    );
  }

  return null;
}
