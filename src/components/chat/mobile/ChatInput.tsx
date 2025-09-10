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
    return templates.filter(t => t.toLowerCase().includes(q)).slice(0, 3); // Fewer on mobile
  }, [templates, value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="relative">
      {/* Mobile autocomplete - appears above input */}
      {focused && filteredTemplates.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-neutral-200 max-h-32 overflow-y-auto">
          {filteredTemplates.map((t, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-4 py-3 border-b border-neutral-100 text-sm active:bg-neutral-50 transition-colors"
              onTouchStart={() => onChange(t)}
              onClick={() => onChange(t)}
            >
              <div className="truncate">{t}</div>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 flex items-end gap-2">
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
              className="h-11 w-11 p-0 flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </>
        )}

        <div className="flex-1 chat-input-container-3d">
          <textarea
            value={value}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={1}
            className="w-full h-11 px-3 py-3 input-3d border-0 bg-transparent shadow-none focus:shadow-none focus:border-0 text-base resize-none"
            style={{
              minHeight: '44px',
              maxHeight: '88px',
            }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 88) + 'px';
            }}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          threeD
          className="h-11 w-11 p-0 flex-shrink-0"
          disabled={!value.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
