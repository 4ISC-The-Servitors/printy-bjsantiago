// TODO: Backend Integration
// - Implement conversation persistence to database
// - Add real-time chat updates with Supabase subscriptions
// - Store chat context and state in database
// - Implement proper error handling and retry logic
// - Add support for file uploads and attachments
// - Implement chat history and search functionality

export interface BotMessage {
  role: 'printy';
  text: string;
}

export interface FlowContext {
  [key: string]: any;
}

export interface FlowResponse {
  messages: BotMessage[];
  quickReplies?: string[];
}

export interface ChatFlow {
  id: string;
  title: string;
  initial: (ctx: FlowContext) => BotMessage[];
  quickReplies: () => string[];
  respond: (ctx: FlowContext, input: string) => Promise<FlowResponse>;
}
