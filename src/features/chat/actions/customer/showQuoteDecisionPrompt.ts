/**
 * Action handler: show_quote_decision_prompt
 *
 * Shows the warning message and Accept/Reject/End options after displaying the quote price.
 *
 * @description
 * - Displays IMPORTANT warning about order cancellation
 * - Shows Accept Quote, Reject Quote, and End Chat options
 * - No database queries needed - just displays UI
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer viewing the quote
 *
 * @returns ActionExecutionResult with warning message and quick reply options
 */
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function showQuoteDecisionPrompt(
  _params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  // Add warning message
  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: 'IMPORTANT: Once you accept this quote, you CANNOT cancel your order. Payment is required upfront before we begin processing your order.',
    ts: Date.now(),
  });

  console.log(
    '[showQuoteDecisionPrompt] Returning warning message and options'
  );

  // Return with quick reply options
  return {
    messages,
    quickReplies: [
      {
        label: 'Accept Quote',
        value: 'Accept Quote',
        next: 'accept_quote',
      },
      {
        label: 'Reject Quote',
        value: 'Reject Quote',
        next: 'reject_quote',
      },
      {
        label: 'End Chat',
        value: 'End Chat',
        next: 'end',
      },
    ],
  };
}
