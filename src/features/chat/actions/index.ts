/**
 * Unified action registry entrypoint
 *
 * Keeps admin and customer action handlers defined in their own folders,
 * but exposes a single `actionHandlers` map for the flow processor.
 */

import type { ActionHandler } from '../types';

// Import the per-role registries
import { actionHandlers as adminActionHandlers } from './admin/index';
import { actionHandlers as customerActionHandlers } from './customer/index';

/**
 * Merged registry. Action names are distinct across roles
 * (e.g., `display_quote_details_admin` vs `display_quote_details`).
 */
export const actionHandlers: Record<string, ActionHandler> = {
  ...customerActionHandlers,
  ...adminActionHandlers,
};

// Re-export individual handlers if callers need direct imports
export * from './admin/index';
export * from './customer/index';
