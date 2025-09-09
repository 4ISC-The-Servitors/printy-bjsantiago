export type ChatRole = 'user' | 'printy';

export interface ChatMessage {
  id: string;
  text: string;
  role: ChatRole;
  ts: number;
  metadata?: Record<string, unknown>;
}

export interface QuickReply {
  id: string;
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
  // Mobile-specific props
  mobileFixed?: boolean;
  mobileOffsetLeftClass?: string;
  hideHeader?: boolean;
}
