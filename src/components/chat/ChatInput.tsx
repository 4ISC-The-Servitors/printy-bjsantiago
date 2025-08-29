import React, { useMemo, useRef, useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '../shared';

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
  const [focused, setFocused] = useState(false);

  const templates = useMemo(
    () => [
      'update order ORD-12353 status to Processing',
      'show tickets from last 7 days',
      'toggle service SRV-CP002 availability',
    ],
    []
  );

  const filteredTemplates = useMemo(() => {
    const q = (value || '').toLowerCase().trim();
    if (!q) return [] as string[];
    return templates.filter(t => t.toLowerCase().includes(q)).slice(0, 5);
  }, [templates, value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-neutral-200 flex items-center gap-2 relative"
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
            size="sm"
            threeD
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 sm:h-11 sm:px-4 lg:h-12 lg:px-6"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </>
      )}
      <div className="flex-1 chat-input-container-3d chat-input-responsive relative">
        <input
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full input-3d border-0 bg-transparent shadow-none focus:shadow-none focus:border-0"
        />
        {focused && filteredTemplates.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-neutral-200 rounded-lg shadow-md p-2 z-10">
            {filteredTemplates.map((t, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-2 py-1 rounded hover:bg-neutral-50 text-sm"
                onMouseDown={() => onChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        threeD
        className="shrink-0 sm:h-11 sm:px-4 lg:h-12 lg:px-6"
      >
        <Send className="w-4 h-4 sm:mr-1" />
        <span className="hidden sm:inline">Send</span>
      </Button>
    </form>
  );
};

export default ChatInput;
