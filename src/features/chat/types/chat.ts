export type ChatRole = 'user' | 'printy';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
  isHistorical?: boolean; // Indicates if this is a pre-existing message from database
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
  onQuickReply?: (data: { value: string; label: string }) => void;
  inputPlaceholder?: string;
  onEndChat?: () => void;
  showAttach?: boolean;
  hideHeader?: boolean;
  hideSelectedBar?: boolean;
  hideInput?: boolean;
  readOnly?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
}
