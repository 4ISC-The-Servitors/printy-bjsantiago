import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input from './Input';
import { Search as SearchIcon, X } from 'lucide-react';
// Responsive classes applied directly

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Search: React.FC<SearchProps> = ({
  value,
  onChange,
  placeholder = 'Search orders…',
  debounceMs = 250,
  className,
  size = 'md',
}) => {
  const [draft, setDraft] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Responsive hooks - no longer needed since we're using direct responsive classes

  // Keep local draft in sync when value changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Debounced propagate
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [draft, value, onChange, debounceMs]);

  const showClear = useMemo(() => draft.length > 0, [draft]);

  // Size variants - responsive scaling following the guide
  const sizeClasses = {
    sm: 'h-8 text-xs sm:h-9 sm:text-sm',
    md: 'h-8 text-xs sm:h-9 sm:text-sm md:h-10 md:text-base',
    lg: 'h-8 text-xs sm:h-9 sm:text-sm md:h-10 md:text-base lg:h-11 lg:text-lg', // Responsive scaling
  };

  const iconSizes = {
    sm: 'w-3 h-3 sm:w-4 sm:h-4',
    md: 'w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5',
    lg: 'w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5', // Small to medium icons
  };

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 md:pl-3.5 text-neutral-500 z-10">
        <SearchIcon className={iconSizes[size]} strokeWidth={2} />
      </div>
      <Input
        ref={inputRef as any}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        placeholder={placeholder}
        className={`pl-8 sm:pl-10 md:pl-11 pr-8 sm:pr-10 ${sizeClasses[size]}`}
        aria-label="Search orders"
      />
      {showClear && (
        <button
          className="absolute right-0 inset-y-0 flex items-center pr-2 sm:pr-3 text-neutral-400 hover:text-neutral-600 transition-colors z-10"
          aria-label="Clear search"
          onClick={() => {
            setDraft('');
            onChange('');
            inputRef.current?.focus();
          }}
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
};

export default Search;


