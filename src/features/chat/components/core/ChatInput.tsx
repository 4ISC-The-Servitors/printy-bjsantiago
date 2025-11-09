import React, { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@shared/components';
import { useDeviceUtils } from '@shared/hooks/ui';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  placeholder?: string;
  showAttach?: boolean;
  onAttachFiles?: (files: FileList) => void;
  disabled?: boolean;
}

/**
 * Unified chat input component with attachment support
 * Used across all chat layouts (customer, admin, landing)
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  showAttach = true,
  onAttachFiles,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isMobileOrTablet } = useDeviceUtils();

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight, but cap at max height (roughly 6 lines)
    const maxHeight = 144; // 6 lines × 24px line-height
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!disabled && value.trim()) {
      onSubmit(e);
      // Reset textarea height after submitting
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile/tablet: Enter always creates new line, only Send button submits
    // On desktop/laptop: Enter submits message, Shift+Enter creates new line
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!isMobileOrTablet) {
        // Desktop/laptop: Enter submits
        e.preventDefault();
        handleSubmit();
      }
      // Mobile/tablet: Allow default behavior (new line)
    }
    // Shift+Enter always creates new line (default behavior)
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(e);
      }}
      className="p-4 flex items-end gap-3 relative"
    >
      {showAttach && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => {
              if (e.target.files && onAttachFiles) {
                onAttachFiles(e.target.files);
              }
            }}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            threeD
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 px-4"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
        </>
      )}

      <div className="flex-1 chat-input-container-3d relative flex items-center">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full min-h-[48px] max-h-[144px] px-4 py-3 input-3d border-0 bg-transparent shadow-none focus:shadow-none focus:border-0 text-base disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto"
          style={{ height: 'auto' }}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        threeD
        className="h-12 min-h-[48px] px-4 sm:px-6 shrink-0"
        disabled={disabled || !value.trim()}
      >
        <Send className="w-5 h-5 sm:mr-2" />
        <span className="hidden sm:inline">Send</span>
      </Button>
    </form>
  );
};

export default ChatInput;
