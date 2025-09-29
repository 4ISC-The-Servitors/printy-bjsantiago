import type { ChatFlow } from '../../../types/chatFlow';

// This is a minimal AboutUs flow that works with the database
// The actual flow logic is handled by the database via chatFlowApi
export const aboutUsFlow: ChatFlow = {
  id: 'about',
  title: 'About Us',
  initial: (_ctx) => [
    {
      role: 'printy',
      text:
        "Welcome to B.J. Santiago Inc.! I'm Printy, your virtual assistant. How can I help you today?",
    },
  ],
  respond: async (_ctx, _input) => {
    // This should not be called directly as the flow is handled by the database
    return {
      messages: [
        {
          role: 'printy',
          text:
            'This flow is handled by the database. Please use the proper flow initialization.',
        },
      ],
      quickReplies: ['End Chat'],
    };
  },
  quickReplies: () => ['End Chat'],
};
