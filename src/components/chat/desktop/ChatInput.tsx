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
    <form
      onSubmit={handleSubmit}
      className="p-4 flex items-center gap-3 relative"
    >
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
            size="md"
            threeD
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 px-4"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
        </>
      )}

      <div className="flex-1 chat-input-container-3d relative">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 px-4 input-3d border-0 bg-transparent shadow-none focus:shadow-none focus:border-0 text-base"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        threeD
        className="h-12 px-6"
      >
        <Send className="w-5 h-5 mr-2" />
        Send
      </Button>
    </form>
  );
};

export default ChatInput;
