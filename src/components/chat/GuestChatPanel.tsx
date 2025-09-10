import React, { useEffect, useState } from 'react';
import DesktopChatPanel from './desktop/ChatPanel';
import MobileChatPanel from './mobile/ChatPanel';
import type { ChatMessage, QuickReply } from './_shared/types';

interface GuestChatPanelProps {
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

export const GuestChatPanel: React.FC<GuestChatPanelProps> = ({
  title = 'Chat',
  messages,
  onSend,
  isTyping = false,
  onAttachFiles,
  onBack,
  quickReplies,
  onQuickReply,
  inputPlaceholder = 'Type a message...',
  onEndChat,
  showAttach = true,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const commonProps = {
    title,
    messages,
    onSend,
    isTyping,
    onAttachFiles,
    onBack,
    quickReplies,
    onQuickReply,
    inputPlaceholder,
    onEndChat,
    showAttach,
  };

  return (
    <div className="w-full relative h-96 max-h-96">
      {/* Render appropriate version based on screen size */}
      {isMobile ? (
        <MobileChatPanel
          {...commonProps}
          mobileFixed={false} // Guest panels don't use fixed positioning
        />
      ) : (
        <DesktopChatPanel {...commonProps} />
      )}
    </div>
  );
};

export default GuestChatPanel;
