import React from 'react';
import ChatDock from '../../shared/ChatDock';
import DesktopChatPanel from '../../chat/desktop/ChatPanel';
import SelectedChipsBar from '../../shared/SelectedChipsBar';

interface Props {
  open: boolean;
  onToggle: () => void;
  selected: { id: string; label: string }[];
  onRemoveSelected: (id: string) => void;
  onClearSelected: () => void;
  title?: string;
  messages: any[];
  isTyping?: boolean;
  quickReplies?: any[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
}

const AdminChatDock: React.FC<Props> = ({
  open,
  onToggle,
  selected,
  onRemoveSelected,
  onClearSelected,
  title = 'Printy Assistant',
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  onEndChat,
}) => {
  return (
    <ChatDock
      open={open}
      onToggle={onToggle}
      selected={selected}
      onRemoveSelected={onRemoveSelected}
      onClearSelected={onClearSelected}
      header={null}
    >
      <DesktopChatPanel
        title={title}
        messages={messages}
        isTyping={isTyping}
        quickReplies={quickReplies}
        onSend={onSend}
        onQuickReply={onQuickReply}
        onEndChat={onEndChat}
      />
      {selected && selected.length > 0 && (
        <SelectedChipsBar
          title="Selected Components"
          items={selected}
          onRemove={onRemoveSelected}
          onClear={onClearSelected}
        />
      )}
    </ChatDock>
  );
};

export default AdminChatDock;
