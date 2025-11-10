/**
 * Action handler: display_quote_details
 *
 * Displays comprehensive details of a quote request, including the original customer
 * request and any admin proposals with specifications and pricing.
 *
 * @description
 * - Fetches original customer quote request messages from chat history
 * - Retrieves latest quote proposal (if any) with specifications and pricing
 * - Formats and displays all quote information in a structured message
 * - Updates session context with proposal status for dynamic flow control
 * - Persists the formatted details message to chat history
 *
 * Information displayed:
 * - Original customer request text
 * - Admin proposal specifications (product, category, size, materials, color, finishing, quantity, deadline)
 * - Admin notes
 * - Quoted price
 * - Proposal status
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id/session_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer viewing the quote details
 *
 * @returns ActionExecutionResult with formatted quote details message
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_details",
 *   "type": "action",
 *   "action": "display_quote_details",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "ask_action_node"
 * }
 * ```
 *
 * @remarks
 * - Uses RPC function api_fetch_chat_messages_v2 to securely fetch encrypted messages
 * - Falls back to session metadata if message fetching fails due to RLS
 * - Updates session context with has_proposal and proposal_status for conditional flow logic
 * - Displays "under review" message if no proposal exists yet
 */

import { supabase } from '@lib/supabase';
import { fetchCompleteQuoteDetails } from '@features/chat/helpers/quoteDetailsHelper';
import {
  buildSpecHeaderLines,
  buildSpecDetailLines,
} from '@features/chat/helpers/specDisplay';
import {
  withErrorHandling,
  ErrorMessages,
  validateRequiredContext,
} from '@features/chat/helpers/errorHandling';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import type { SessionMetadata } from '@features/chat/types';

export async function displayQuoteDetails(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'display_quote_details',
    async () => {
      const { actionNode, context, sessionId } = params;

      // ✅ PHASE 3: Use standardized error handling
      const config = actionNode.action_config as any;
      const conversationIdKey = config.conversation_id_key || 'session_id';
      const conversationId = String(context[conversationIdKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [conversationIdKey]: conversationId },
        [conversationIdKey],
        'display_quote_details'
      );
      if (validationError) {
        return validationError;
      }

      // ✅ PHASE 3: Use shared helper functions
      const quoteDetails = await fetchCompleteQuoteDetails(conversationId);
      const messages: Array<{
        id: string;
        role: 'printy';
        text: string;
        ts: number;
      }> = [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Your Original Request:\n\n${quoteDetails.originalRequest}`,
          ts: Date.now(),
        },
      ];

      // Add proposal bubble (separate)
      if (quoteDetails.hasProposal && quoteDetails.proposal) {
        const proposalSpec = (quoteDetails.proposal?.specFinal || {}) as any;
        const headerLines = await buildSpecHeaderLines(
          {
            service_id: proposalSpec?.service_id,
            category: proposalSpec?.category,
          },
          { includeService: false, includeCategory: false }
        );
        const detailLines = buildSpecDetailLines(
          proposalSpec,
          quoteDetails.proposal?.notes
        );
        const proposalText = [
          'Admin Proposal:',
          '',
          ...headerLines,
          ...detailLines,
        ].join('\n');

        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: proposalText,
          ts: Date.now(),
        });

        if (quoteDetails.proposal.quotedPrice != null) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: `Quoted Price: ₱${quoteDetails.proposal.quotedPrice}`,
            ts: Date.now(),
          });
        }
      } else {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Your quote request is being reviewed by our admin team. We will send you a detailed proposal with pricing soon.',
          ts: Date.now(),
        });
      }

      // Append valued-specific note if applicable
      const customerType = String((context as any)?.customer_type || 'regular');
      if (customerType === 'valued') {
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Note: As a valued customer, once you accept the proposal, your order will move directly to processing without upfront payment.',
          ts: Date.now(),
        });
      }

      // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
      // This prevents duplicate messages in the database

      // Store proposal status in context for dynamic options
      const { data: currentSession } = await supabase
        .from('chat_sessions_v2')
        .select('metadata')
        .eq('session_id', sessionId)
        .single();

      if (currentSession) {
        const currentMetadata = currentSession.metadata as SessionMetadata;
        // Note: Still using direct update here since this is at action level
        // SessionStateManager is used at flow processor level
        await supabase
          .from('chat_sessions_v2')
          .update({
            metadata: {
              ...currentMetadata,
              context: {
                ...context,
                has_proposal: quoteDetails.hasProposal,
                proposal_admin_notes: quoteDetails.proposal?.notes || undefined,
              } as any,
            },
          })
          .eq('session_id', sessionId);
      }

      // Return context updates for flow processor
      return {
        messages,
        context: {
          has_proposal: quoteDetails.hasProposal,
          proposal_admin_notes: quoteDetails.proposal?.notes || undefined,
        },
      };
    },
    ErrorMessages.QUOTE_DETAILS_LOAD_FAILED
  );
}
