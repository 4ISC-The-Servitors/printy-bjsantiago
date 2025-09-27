import React, { useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '../../shared';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  placeholder?: string;
  showAttach?: boolean;
  onAttachFiles?: (files: FileList) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  showAttach = true,
  onAttachFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="p-2 flex items-center gap-2">
        {showAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => {
                if (e.target.files && onAttachFiles)
                  onAttachFiles(e.target.files);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              threeD
              aria-label="Attach files"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 p-0 flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </>
        )}

        <div className="flex-1 chat-input-container-3d">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={1}
            className="w-full h-10 px-3 py-2 input-3d border-0 bg-transparent shadow-none focus:shadow-none focus:border-0 text-base resize-none"
            style={{
              minHeight: '40px',
              maxHeight: '72px',
            }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 72) + 'px';
            }}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          threeD
          className="h-10 w-10 p-0 flex-shrink-0"
          disabled={!value.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
