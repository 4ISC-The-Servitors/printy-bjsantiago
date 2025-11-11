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
import { supabase } from '@lib/supabase';

export async function showQuoteDecisionPrompt(
  _params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  // Determine customer type (context -> DB fallback)
  const contextRoleRaw =
    ((_params.context as any)?.customer_type as string | undefined) ||
    ((_params.context as any)?.context?.customer_type as string | undefined);
  let customerType = (contextRoleRaw || '').toString();

  if (!customerType && _params.customerId) {
    try {
      const { data: cust } = await supabase
        .from('customer')
        .select('customer_type')
        .eq('customer_id', _params.customerId)
        .maybeSingle();
      customerType = String((cust?.customer_type as string) || 'regular');
    } catch {
      customerType = 'regular';
    }
  }
  if (!customerType) customerType = 'regular';
  const roleNormalized = customerType.toLowerCase();

  // Add warning message (branch for valued)
  const warningText =
    roleNormalized === 'valued'
      ? 'IMPORTANT: Once you accept this quote, you CANNOT cancel your order. As a valued customer, no upfront payment is required. If you want a negotiation without rejecting this proposal, please open a support ticket via Ask Assistance in your dashboard so we can assist you.'
      : 'IMPORTANT: Once you accept this quote, you CANNOT cancel your order. Payment is required upfront before we begin processing your order. If you want a negotiation without rejecting this proposal, please open a support ticket via Ask Assistance in your dashboard so we can assist you.';

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: warningText,
    ts: Date.now(),
  });

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
