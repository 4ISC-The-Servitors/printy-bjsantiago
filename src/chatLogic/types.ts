export interface BotMessage {
  role: 'bot' | 'assistant';
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
