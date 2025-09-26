import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
// ====================
import { supabase } from '../../../lib/supabase';
// ==================== - jorrel i added this to know where changes were its a before and after

type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

const NODES: Record<string, Node> = {

  issue_ticket_intro: {
    id: 'issue_ticket_intro',
    message:
      "Hi! I'm Printy 🤖. Before we start, do you already have your order number?",
    options: [
      { label: 'Yes, I have it', next: 'issue_ticket_start' },
      { label: "I don't have it", next: 'no_order_number' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  issue_ticket_start: {
    id: 'issue_ticket_start',
    message:
      "Hi! I'm Printy 🤖. I'll help you create a support ticket. What's your order number?",
    options: [
      { label: 'End Chat', next: 'end' },
    ],
  },

  
  // ====================
  order_issue_menu: {
    id: 'order_issue_menu',
    answer:
      'What issue are you experiencing with this order? Choose one so I can create a ticket.',
    options: [
      { label: 'Printing quality issue', next: 'quality_issue' },
      { label: 'Delivery problem', next: 'delivery_issue' },
      { label: 'Billing question', next: 'billing_issue' },
      { label: 'Other concern', next: 'other_issue' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  // ====================

  no_order_number: {
    id: 'no_order_number',
    question: 'No Order Number',
    answer:
      'No problem! I can still help you create a ticket. What issue are you experiencing?',
    options: [
      { label: 'Printing quality issue', next: 'quality_issue' },
      { label: 'Delivery problem', next: 'delivery_issue' },
      { label: 'Billing question', next: 'billing_issue' },
      { label: 'Other concern', next: 'other_issue' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  quality_issue: {
    id: 'quality_issue',
    question: 'Printing Quality Issue',
    answer:
      'I understand you have a printing quality concern. Please describe the issue in detail so I can create the right ticket.',
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  delivery_issue: {
    id: 'delivery_issue',
    question: 'Delivery Problem',
    answer:
      "I'm sorry to hear about the delivery issue. Please provide details about what happened.",
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  billing_issue: {
    id: 'billing_issue',
    question: 'Billing Question',
    answer:
      "I can help with your billing concern. Please describe the issue you're experiencing.",
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  other_issue: {
    id: 'other_issue',
    question: 'Other Concern',
    answer:
      "I'm here to help with any other concerns you may have. Please describe the issue.",
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  submit_ticket: {
    id: 'submit_ticket',
    question: 'Submit Ticket',
    answer:
      "Thank you for providing the details. I've created a support ticket for you. Our team will review it and get back to you within 24 hours.",
    options: [{ label: 'End Chat', next: 'end' }],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'issue_ticket_start';
let collectedIssueDetails = '';
let currentInquiryType: string | null = null; // ✅ added

const DETAIL_NODE_IDS = new Set<keyof typeof NODES>([
  'quality_issue',
  'delivery_issue',
  'billing_issue',
  'other_issue',
]);

// Added a function to retrieve the current logged-in user's customer_id

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const issueTicketFlow: ChatFlow = {
  id: 'issue-ticket',
  title: 'Issue a Ticket',
  initial: () => {
    currentNodeId = 'issue_ticket_intro'; // ✅ start with intro question
    collectedIssueDetails = '';
    currentInquiryType = null;
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
    const current = NODES[currentNodeId];

    // ====================
    // Blacklisted words (basic profanity filter)
    // ====================
    const BLACKLIST = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger'];

    function checkBlacklistedWord(input: string): string | null {
      const lower = input.toLowerCase();
      for (const word of BLACKLIST) {
        if (lower.includes(word)) {
          return word; // return the matched bad word
        }
      }
      return null;
    }

    // ====================
    // Global profanity filter
    // ====================
    const flaggedWord = checkBlacklistedWord(input);
    if (flaggedWord) {
      if (
        currentNodeId === 'issue_ticket_start' ||
        currentNodeId === 'no_order_number'
      ) {
        return {
          messages: [
            {
              role: 'printy',
              text: `⚠️ You have entered a flagged word that is "${flaggedWord}".`,
            },
            { role: 'printy', text: 'Please type a valid order number.' },
          ],
          quickReplies: nodeQuickReplies(NODES.issue_ticket_start),
        };
      } else if (DETAIL_NODE_IDS.has(currentNodeId)) {
        return {
          messages: [
            {
              role: 'printy',
              text: `⚠️ You have entered a flagged word that is "${flaggedWord}".`,
            },
            { role: 'printy', text: 'Please rephrase, use appropriate words.' },
          ],
          quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
      }
    }
    // ====================

    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );

    // ====================
    // Backtracking handler
    if (/^(go\s*back|see\s*menu\s*again|back|menu)$/i.test(input.trim())) {
      return {
        messages: [
          { role: 'printy', text: 'Where would you like to back track?' },
        ],
        quickReplies: [
          '🔄 Back to start (order number check)',
          '📋 Back to choosing issue type',
        ],
      };
    }

    if (/^🔄\s*Back to start/i.test(input.trim())) {
      currentNodeId = 'issue_ticket_start';
      collectedIssueDetails = '';
      currentInquiryType = null;
      return {
        messages: nodeToMessages(NODES.issue_ticket_start),
        quickReplies: nodeQuickReplies(NODES.issue_ticket_start),
      };
    }

    if (/^📋\s*Back to choosing issue type/i.test(input.trim())) {
      currentNodeId = 'order_issue_menu';
      collectedIssueDetails = '';
      currentInquiryType = null;
      return {
        messages: nodeToMessages(NODES.order_issue_menu),
        quickReplies: nodeQuickReplies(NODES.order_issue_menu),
      };
    }
    // ====================


   



    // Free-text handling at start: treat input as an order number and look it up
    if (!selection && currentNodeId === 'issue_ticket_start') {
      const orderNumber = input.trim();
      if (!orderNumber) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please enter a valid order number or choose an option.',
            },
          ],
          quickReplies: nodeQuickReplies(current),
        };
      }
      // ====================
      // Hardcoded test order(s) so you can verify the flow without DB
      if (orderNumber.toUpperCase() === 'TEST123' || orderNumber === '12345') {
        const mockOrder = {
          order_id: orderNumber,
          order_status: 'processing',
          order_datetime: new Date(Date.now() - 7 * 86400000), // 7 days ago
          completed_datetime: null,
          page_size: 'A4',
          quantity: 500,
        };
        const mockLines = [
          `Order ${mockOrder.order_id} — Status: ${mockOrder.order_status}`,
          `Placed: ${mockOrder.order_datetime.toLocaleString()}`,
          `Page Size: ${mockOrder.page_size}`,
          `Quantity: ${mockOrder.quantity}`,
          'Total: ₱2,000.00',
        ];
        currentNodeId = 'order_issue_menu';
        return {
          messages: [
            { role: 'printy', text: mockLines.join('\n') },
            { role: 'printy', text: 'Is this the correct order?' },
            ...nodeToMessages(NODES.order_issue_menu),
          ],
          quickReplies: nodeQuickReplies(NODES.order_issue_menu),
        };
      }
      // ====================

      // NOTE: Adjust table/columns below to match your schema
      const { data: order, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_id,
          status,
          created_at,
          total,
          order_items (
            name,
            quantity,
            price
          )
        `
        )
        .eq('order_id', orderNumber)
        .maybeSingle();

      if (error || !order) {
        return {
          messages: [
            {
              role: 'printy',
              text: `I couldn't find an order with number "${orderNumber}". Please check and try again.`,
            },
          ],
          quickReplies: nodeQuickReplies(NODES.issue_ticket_start),
        };
      }

      const items = Array.isArray((order as any).order_items)
        ? (order as any).order_items
        : [];
      const lines = [
        `Order ${(order as any).order_id} — Status: ${(order as any).status ?? 'N/A'}`,
        `Placed: ${
          (order as any).created_at
            ? new Date((order as any).created_at).toLocaleString()
            : 'N/A'
        }`,
        'Items:',
        ...items.map(
          (it: any) =>
            `- ${it.quantity} x ${it.name}${it.price ? ` @ ${it.price}` : ''}`
        ),
        (order as any).total ? `Total: ${(order as any).total}` : '',
      ].filter(Boolean) as string[];

      currentNodeId = 'order_issue_menu';
      return {
        messages: [
          { role: 'printy', text: lines.join('\n') },
          { role: 'printy', text: 'Is this the correct order?' },
          ...nodeToMessages(NODES.order_issue_menu),
        ],
        quickReplies: nodeQuickReplies(NODES.order_issue_menu),
      };
    }

    if (!selection) {
      if (DETAIL_NODE_IDS.has(currentNodeId)) {
        const detail = input.trim();
        if (detail) {
          collectedIssueDetails = collectedIssueDetails
            ? `${collectedIssueDetails}\n${detail}`
            : detail;
          return {
            messages: [
              {
                role: 'printy',
                text: "Got it. I've added that to your ticket notes. You can add more details or choose 'Submit ticket' when ready.",
              },
            ],
            quickReplies: nodeQuickReplies(current),
          };
        }
      }

      // ====================
      // In no_order_number state: either list orders, or accept an order number selection
      if (currentNodeId === 'no_order_number') {
        const typed = input.trim();
        // If user typed an order number, fetch that order and proceed
        if (typed) {
          const { data: orderPick, error: pickErr } = await supabase
            .from('orders')
            .select(
              `
              id,
              order_id,
              status,
              created_at,
              total,
              order_items (name, quantity, price)
            `
            )
            .eq('order_id', typed)
            .maybeSingle();

          if (!pickErr && orderPick) {
            const items = Array.isArray((orderPick as any).order_items)
              ? (orderPick as any).order_items
              : [];
            const lines = [
              `Order ${(orderPick as any).order_id} — Status: ${(orderPick as any).status ?? 'N/A'}`,
              `Placed: ${
                (orderPick as any).created_at
                  ? new Date((orderPick as any).created_at).toLocaleString()
                  : 'N/A'
              }`,
              'Items:',
              ...items.map(
                (it: any) =>
                  `- ${it.quantity} x ${it.name}${it.price ? ` @ ${it.price}` : ''}`
              ),
              (orderPick as any).total
                ? `Total: ${(orderPick as any).total}`
                : '',
            ].filter(Boolean) as string[];

            currentNodeId = 'order_issue_menu';
            return {
              messages: [
                { role: 'printy', text: lines.join('\n') },
                { role: 'printy', text: 'Is this the correct order?' },
                ...nodeToMessages(NODES.order_issue_menu),
              ],
              quickReplies: nodeQuickReplies(NODES.order_issue_menu),
            };
          }
        }

        // Otherwise, list recent orders for the signed-in user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const uid = user?.id;
        if (!uid) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'You need to be signed in to view your orders.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        // Query up to 10 latest orders for this user (by customer_id)
        const { data: orders, error: ordersErr } = await supabase
          .from('orders')
          .select('order_id, total, created_at')
          .eq('customer_id', uid)
          .order('created_at', { ascending: false })
          .limit(10);

        if (ordersErr || !orders || orders.length === 0) {
          return {
            messages: [
              {
                role: 'printy',
                text: "I couldn't find any past orders for your account. If you think this is a mistake, please try again later or contact support.",
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        // Compose a compact list: date — order number — total
        const lines: string[] = ['Here are your recent orders:', ''];
        for (const o of orders as any[]) {
          lines.push(
            `${new Date(o.created_at).toLocaleDateString()} — ${o.order_id} — Total: ${o.total ?? 'N/A'}`
          );
        }

        return {
          messages: [
            {
              role: 'printy',
              text:
                lines.join('\n') +
                '\n\nPlease type or click the order number you have an issue with.',
            },
          ],
          quickReplies: (orders as any[]).map(o => o.order_id as string),
        };
      }
      // ====================

      return {
        messages: [
          { role: 'printy', text: 'Please choose one of the options.' },
        ],
        quickReplies: nodeQuickReplies(NODES.order_issue_menu),
      };
    }

    const nextNodeId = selection.next as keyof typeof NODES;

    // ====================
    // Capture inquiry_type from the chosen category button
    if (nextNodeId === 'quality_issue') currentInquiryType = 'quality';
    else if (nextNodeId === 'delivery_issue') currentInquiryType = 'delivery';
    else if (nextNodeId === 'billing_issue') currentInquiryType = 'billing';
    else if (nextNodeId === 'other_issue') currentInquiryType = 'other';
    // ====================

    if (nextNodeId === 'no_order_number') {
      // ====================
      // Immediately list orders when entering the no_order_number node
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id;
      if (!uid) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'You need to be signed in to view your orders.',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('order_id, total, created_at')
        .eq('customer_id', uid)
        .order('created_at', { ascending: false })
        .limit(10);

      const lines: string[] = ['Here are your recent orders:', ''];
      for (const o of (orders as any[]) ?? []) {
        lines.push(
          `${new Date(o.created_at).toLocaleDateString()} — ${o.order_id} — Total: ${o.total ?? 'N/A'}`
        );
      }

      currentNodeId = 'no_order_number';
      return {
        messages: [
          {
            role: 'printy',
            text:
              lines.join('\n') +
              '\n\nPlease type or click the order number you have an issue with.',
          },
        ],
        quickReplies: ((orders as any[]) ?? []).map(o => o.order_id as string),
      };
      // ====================
    }
    if (nextNodeId === 'submit_ticket') {
      const inquiryId = (crypto as any)?.randomUUID?.()
        ? (crypto as any).randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    
      const message = collectedIssueDetails || '(no details provided)';
      let customerId: string | null = null;
    
      try {
        // ✅ Resolve current authenticated user's customer_id
        const { data: session } = await supabase.auth.getUser();
        const authId = session?.user?.id || null;
        if (authId) {
          const { data: customerRow } = await supabase
            .from('customer')
            .select('customer_id')
            .eq('customer_id', authId)
            .maybeSingle();
          customerId = (customerRow as any)?.customer_id || null;
        }
    
        const inquiryType = currentInquiryType ?? 'other';
    
        const { error } = await supabase.from('inquiries').insert([
          {
            inquiry_id: inquiryId,
            inquiry_message: message,
            inquiry_status: 'new',
            received_at: new Date().toISOString(),
            inquiry_type: inquiryType,
            customer_id: customerId,
          },
        ]);
    
        if (error) {
          console.error('Insert failed:', error);
          return {
            messages: [
              {
                role: 'printy',
                text: "❌ Couldn't create the ticket. Try again later.",
              },
            ],
            quickReplies: nodeQuickReplies(current),
          };
        }
    
        // ✅ Reset state
        collectedIssueDetails = '';
        currentInquiryType = null;
    
        return {
          messages: [
            { role: 'printy', text: '✅ Ticket submitted successfully!' },
            { role: 'printy', text: `📌 Your ticket number is: ${inquiryId}` },
          ],
          quickReplies: ['End Chat'],
        };
      } catch (_e) {
        console.error('Insert error:', _e);
        return {
          messages: [
            { role: 'printy', text: '❌ Error creating ticket. Please try again.' },
          ],
          quickReplies: nodeQuickReplies(current),
        };
      }
    }
    


    currentNodeId = nextNodeId;
    return {
      messages: nodeToMessages(NODES[nextNodeId]),
      quickReplies: nodeQuickReplies(NODES[nextNodeId]),
    };
  },
};
