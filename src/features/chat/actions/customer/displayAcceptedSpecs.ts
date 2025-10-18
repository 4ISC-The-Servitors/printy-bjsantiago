import { supabase } from '@lib/supabase';
import type { ActionHandler } from '@features/chat/types';

export const displayAcceptedSpecs: ActionHandler = async ({
  customerId,
  context,
}) => {
  console.log('[displayAcceptedSpecs] Action called');
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    const orderId = context.order_id;
    
    if (!orderId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: No order ID provided. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Fetch order details to get proposal_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_id, display_id, proposal_id, total_amount, status')
      .eq('order_id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      console.error('[displayAcceptedSpecs] Error fetching order:', orderError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: Order not found or you do not have permission to view this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!order.proposal_id) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: No proposal found for this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Fetch the accepted proposal specs
    const { data: proposal, error: proposalError } = await supabase
      .from('quote_proposals')
      .select(`
        proposal_id,
        spec_id,
        spec_final,
        quoted_price,
        notes,
        status,
        created_at
      `)
      .eq('proposal_id', order.proposal_id)
      .eq('status', 'accepted')
      .single();

    if (proposalError || !proposal) {
      console.error('[displayAcceptedSpecs] Error fetching proposal:', proposalError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: Accepted proposal not found for this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Format the specs message
    let specsMessage = `Here are the accepted specifications for your order (${order.display_id}):\n\n`;
    
    // Try to get specs from spec_final first, then from quote_specs table
    let specs: any = null;
    
    if (proposal.spec_final) {
      specs = proposal.spec_final;
      console.log('[displayAcceptedSpecs] Using spec_final from proposal');
    } else if (proposal.spec_id) {
      // Fetch from quote_specs table
      const { data: specData, error: specError } = await supabase
        .from('quote_specs')
        .select('spec_data')
        .eq('spec_id', proposal.spec_id)
        .single();
      
      if (specData && !specError) {
        specs = specData.spec_data;
        console.log('[displayAcceptedSpecs] Using spec_data from quote_specs');
      }
    }
    
    if (specs) {
      try {
        // Format the specs in a readable bullet-point style
        const formatValue = (value: any): string => {
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          return String(value);
        };

        // Common specification fields to display
        const specFields = [
          { key: 'product', label: 'Product' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'size', label: 'Size' },
          { key: 'materials', label: 'Materials' },
          { key: 'color', label: 'Color' },
          { key: 'finishing', label: 'Finishing' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'deadline', label: 'Deadline' },
          { key: 'notes', label: 'Notes' },
          { key: 'artwork', label: 'Artwork' },
          { key: 'others', label: 'Others' },
          { key: 'admin_notes', label: 'Admin Notes' }
        ];

        // Display each specification field if it exists
        specFields.forEach(field => {
          if (specs[field.key] !== undefined && specs[field.key] !== null && specs[field.key] !== '') {
            specsMessage += `• ${field.label}: ${formatValue(specs[field.key])}\n`;
          }
        });

        // If no standard fields found, try to display items array
        if (specs.items && Array.isArray(specs.items)) {
          specs.items.forEach((item: any, index: number) => {
            specsMessage += `\nItem ${index + 1}:\n`;
            specFields.forEach(field => {
              if (item[field.key] !== undefined && item[field.key] !== null && item[field.key] !== '') {
                specsMessage += `• ${field.label}: ${formatValue(item[field.key])}\n`;
              }
            });
          });
        }

        // If still no specs displayed, show a fallback message
        if (specsMessage === `Here are the accepted specifications for your order (${order.display_id}):\n\n`) {
          specsMessage += 'Specifications are available but in a different format.';
        }

      } catch (parseError) {
        console.error('[displayAcceptedSpecs] Error parsing specs:', parseError);
        specsMessage += 'Specifications data is available but cannot be displayed in detail.';
      }
    } else {
      specsMessage += 'No detailed specifications available.';
    }
    
    // Add quoted price if available
    if (proposal.quoted_price) {
      specsMessage += `\nQuoted Price: ₱${parseFloat(proposal.quoted_price).toFixed(2)}`;
    }
    
    // Add notes if available
    if (proposal.notes) {
      specsMessage += `\n\nNotes: ${proposal.notes}`;
    }

    console.log('[displayAcceptedSpecs] Pushing specs message');
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: specsMessage,
      ts: Date.now(),
    });

    console.log('[displayAcceptedSpecs] Returning messages:', messages.length);
    return { messages };
  } catch (error) {
    console.error('[displayAcceptedSpecs] Error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error retrieving your order specifications. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
};
