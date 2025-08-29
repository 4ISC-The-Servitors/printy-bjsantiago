import type { ChatFlow } from '../../types/chatFlow';

const introFlow: ChatFlow = {
  id: 'admin-intro',
  title: 'Admin Intro',
  initial: () => [
    {
      role: 'printy',
      text: "Hello! I'm Printy, your admin assistant. What would you like to do today?",
    },
  ],
  quickReplies: () => ['Manage Orders', 'Manage Services', 'End Chat'],
  respond: async (_ctx, input) => {
    const t = input.toLowerCase();
    if (t.includes('order')) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Opening order management… What would you like to do?',
          },
        ],
        quickReplies: ['View Pending', 'Update Status', 'End Chat'],
      };
    }
    if (t.includes('service')) {
      return {
        messages: [
          { role: 'printy', text: 'Opening services… Choose an action.' },
        ],
        quickReplies: ['Add Service', 'Deactivate', 'End Chat'],
      };
    }
    if (t.includes('end')) {
      return {
        messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }],
        quickReplies: ['End Chat'],
      };
    }
    return {
      messages: [{ role: 'printy', text: 'Please choose an option.' }],
      quickReplies: ['Manage Orders', 'Manage Services', 'End Chat'],
    };
  },
};

export const adminFlows: Record<string, ChatFlow> = {
  intro: introFlow,
};

export function resolveAdminFlow(topic?: string | null): ChatFlow | null {
  void topic;
  // Return intro flow for now
  return introFlow;
}

export function dispatchAdminCommand(input: string) {
  const flow = resolveAdminFlow('intro');
  if (!flow) return null;
  
  return flow.respond({}, input);
}
