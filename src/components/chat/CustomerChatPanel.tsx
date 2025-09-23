import React, { useEffect, useState } from 'react';
import DesktopChatPanel from './desktop/ChatPanel';
import MobileChatPanel from './mobile/ChatPanel';
import type { ChatMessage, QuickReply } from './_shared/types';

interface CustomerChatPanelProps {
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
  disabled?: boolean;
}

export const CustomerChatPanel: React.FC<CustomerChatPanelProps> = ({
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
  disabled = false,
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
    onSend: disabled ? () => {} : onSend,
    isTyping,
    onAttachFiles: (files: FileList) => {
      const f = files?.[0];
      if (f) {
        const url = URL.createObjectURL(f);
        // send the image URL so it renders in chat and triggers payment flow detection
        onSend(url);
      }
      onAttachFiles?.(files);
    },
    onBack,
    quickReplies: disabled ? [] : quickReplies,
    onQuickReply: disabled ? undefined : onQuickReply,
    inputPlaceholder,
    onEndChat: disabled ? undefined : onEndChat,
    showAttach: disabled ? false : showAttach,
  };

  return (
    <div className="h-full w-full relative">
      {/* Render appropriate version based on screen size */}
      {isMobile ? (
        <MobileChatPanel
          {...commonProps}
          mobileFixed={true}
          mobileOffsetLeftClass="left-16"
          hideInput={disabled}
        />
      ) : (
        <DesktopChatPanel
          {...commonProps}
          hideSelectedBar={true}
          hideInput={disabled}
          readOnly={!!disabled}
        />
      )}
    </div>
  );
};

export default CustomerChatPanel;
