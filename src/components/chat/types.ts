export type ChatRole = 'user' | 'printy';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
}

export interface QuickReply {
  label: string;
  value: string;
}

export interface ChatPanelProps {
  title?: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isTyping?: boolean;
  onAttachFiles?: (files: FileList) => void;
  onBack?: () => void;
  quickReplies?: QuickReply[];
  onQuickReply?: (value: string) => void;
  inputPlaceholder?: string;
  onEndChat?: () => void;
  showAttach?: boolean;
}
