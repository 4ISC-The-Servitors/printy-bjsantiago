import React from 'react';
import MobileChatPanel from '../../chat/mobile/ChatPanel';

interface Props {
  open: boolean;
  title?: string;
  messages: any[];
  isTyping?: boolean;
  quickReplies?: any[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onClose: () => void;
}

const AdminMobileChatOverlay: React.FC<Props> = ({
  open,
  title = 'Printy Assistant',
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-white">
      <MobileChatPanel
        title={title}
        messages={messages}
        isTyping={isTyping}
        quickReplies={quickReplies}
        onSend={onSend}
        onQuickReply={onQuickReply}
        onEndChat={onClose}
      />
    </div>
  );
};

export default AdminMobileChatOverlay;
