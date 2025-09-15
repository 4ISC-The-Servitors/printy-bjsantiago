import React, { useMemo, useRef, useState } from 'react';
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
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 px-4 input-3d border-0 bg-transparent shadow-none focus:shadow-none focus:border-0 text-base"
        />

        {/* Desktop autocomplete dropdown */}
        {focused && filteredTemplates.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 z-10 max-w-md">
            <div className="text-xs text-neutral-500 px-2 py-1 border-b border-neutral-100 mb-1">
              Quick Commands
            </div>
            {filteredTemplates.map((t, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-neutral-50 text-sm transition-colors"
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
