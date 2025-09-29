import React from 'react';
import type { ChipItem } from './SelectedChipsBar';
import { Button } from './index';

export interface ChatDockProps {
  open: boolean;
  onToggle: () => void;
  selected: ChipItem[];
  onRemoveSelected: (id: string) => void;
  onClearSelected: () => void;
  header?: React.ReactNode;
  children?: React.ReactNode; // chat panel body
}

const ChatDock: React.FC<ChatDockProps> = ({
  open,
  onToggle: _onToggle, // eslint-disable-line @typescript-eslint/no-unused-vars
  selected: _selected, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRemoveSelected: _onRemoveSelected, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClearSelected: _onClearSelected, // eslint-disable-line @typescript-eslint/no-unused-vars
  header,
  children,
}) => {
  if (!open) return null;
  return (
    <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-neutral-200 flex-col z-30">
      {header ? <div className="p-4 border-b">{header}</div> : null}

      {/* Let child chat panel manage its own scroll & footer; avoid extra padding so it occupies full height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children || (
          <div className="p-4 text-sm text-neutral-700">
            <p>Hello! I’m Printy, your admin assistant.</p>
            <div className="mt-3 space-x-2">
              <Button variant="secondary" size="sm">
                Manage Orders
              </Button>
              <Button variant="secondary" size="sm">
                Manage Services
              </Button>
              <Button variant="ghost" size="sm">
                End Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chips bar handled inside DesktopChatPanel now to ensure placement under title */}
    </aside>
  );
};

export default ChatDock;
