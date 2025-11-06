/**
 * Action handler: display_quote_details_admin
 *
 * Admin-facing version of quote details display. Shows customer's original request
 * and any existing proposals with specifications and pricing for admin review.
 *
 * @description
 * - Fetches original customer quote request messages from chat history
 * - Retrieves latest proposal (if any) from quote_proposals table
 * - Formats information for admin audience (technical, internal wording)
 * - Persists formatted details to admin's chat session
 * - Stores source_session_id in context for subsequent actions
 *
 * Information displayed:
 * - Original customer request (all customer messages)
 * - Latest proposal specifications (product, category, description, size, materials, color, finishing, quantity, deadline)
 * - Admin notes
 * - Quoted price
 * - Proposal status
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing session_id/conversation_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with formatted quote details for admin
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_admin_details",
 *   "type": "action",
 *   "action": "display_quote_details_admin",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "ask_admin_action"
 * }
 * ```
 *
 * @remarks
 * - Uses RPC function api_fetch_chat_messages_v2 for secure encrypted message access
 * - Supports both session_id and legacy conversation_id in quote_proposals lookup
 * - Tailored for admin workflow (different wording than customer version)
 * - Stores source_session_id for tracking which quote is being worked on
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

export async function displayQuoteDetailsAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'display_quote_details_admin',
    async () => {
      const { actionNode, context, sessionId } = params;

      // ✅ PHASE 3: Use standardized error handling
      const config = actionNode.action_config as any;
      const sessionIdKey = config.conversation_id_key || 'session_id';
      const quoteSessionId = String(context[sessionIdKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [sessionIdKey]: quoteSessionId },
        [sessionIdKey],
        'display_quote_details_admin'
      );
      if (validationError) {
        return validationError;
      }

      // ✅ PHASE 3: Use shared helper functions
      const quoteDetails = await fetchCompleteQuoteDetails(quoteSessionId);

      const messages: Array<{
        id: string;
        role: 'printy';
        text: string;
        ts: number;
      }> = [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Original Customer Request:\n\n${quoteDetails.originalRequest}`,
          ts: Date.now(),
        },
      ];

      if (quoteDetails.hasProposal && quoteDetails.proposal) {
        const proposalSpec = (quoteDetails.proposal?.specFinal || {}) as any;
        const headerLines = await buildSpecHeaderLines({
          service_id: proposalSpec?.service_id,
          category: proposalSpec?.category,
        });
        const detailLines = buildSpecDetailLines(
          proposalSpec,
          quoteDetails.proposal?.notes
        );

        const proposalText = [
          'Latest Draft/Proposal:',
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
      }

      // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
      // This prevents duplicate messages in the database

      // Store simple flags for downstream nodes
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
                source_session_id: quoteSessionId,
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
          source_session_id: quoteSessionId,
          proposal_admin_notes: quoteDetails.proposal?.notes || undefined,
        },
      };
    },
    ErrorMessages.QUOTE_DETAILS_LOAD_FAILED
  );
}
