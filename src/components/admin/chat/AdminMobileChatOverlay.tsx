import React, { useState, useEffect } from 'react';
import MobileChatPanel from '../../chat/mobile/ChatPanel';
import { Button } from '../../shared';
import { Minus, X } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  messages: any[];
  isTyping?: boolean;
  quickReplies?: any[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
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
  onMinimize,
}) => {
  const [minimized, setMinimized] = useState(false);
  const show = open && !minimized;

  const handleMinimize = () => {
    setMinimized(true);
    onMinimize?.();
  };

  // When the user clicks the navbar Printy button again (open === true),
  // ensure the overlay is restored from minimized state.
  useEffect(() => {
    if (open) setMinimized(false);
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-40 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Slide-in panel from right; full-screen on mobile/tablet */}
      <div
        className={`absolute top-0 right-0 h-full w-full md:w-[520px] max-w-[100vw] bg-white shadow-xl md:rounded-l-2xl pointer-events-auto transform transition-transform duration-300 ease-out ${show ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 md:rounded-tl-2xl">
          <div className="text-sm font-semibold text-neutral-800">{title}</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Minimize chat"
              onClick={handleMinimize}
              className="h-8 w-8 p-0 rounded-md"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Close chat"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-md"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <MobileChatPanel
          title={title}
          messages={messages}
          isTyping={isTyping}
          quickReplies={quickReplies}
          onSend={onSend}
          onQuickReply={onQuickReply}
          onEndChat={onClose}
          mobileOffsetLeftClass="left-0"
          hideHeader
        />
      </div>
    </div>
  );
};

export default AdminMobileChatOverlay;
