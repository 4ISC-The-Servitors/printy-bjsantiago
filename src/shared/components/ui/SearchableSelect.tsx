import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import Input from './Input';

export type SelectOption = { value: string; label: string };

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  fetchOptions: (query: string) => Promise<SelectOption[]>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Select…',
  value,
  onChange,
  fetchOptions,
  required = false,
  disabled = false,
  className,
  emptyText = 'No results',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => items.find(i => i.value === value),
    [items, value]
  );

  // Load items on open and when search changes (debounced)
  useEffect(() => {
    if (!open || disabled) return;
    setLoading(true);
    setError(null);
    const t = window.setTimeout(async () => {
      try {
        const options = await fetchOptions(search);
        setItems(options);
      } catch (e) {
        setError('Failed to load options');
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [open, search, fetchOptions, disabled]);

  // Close when clicking outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className={`space-y-2 ${className ?? ''}`} ref={panelRef}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen(o => {
            const next = !o;
            if (next) setSearch(''); // reset search on open to fetch all
            return next;
          })
        }
        className={`w-full px-4 py-3 border border-neutral-300 rounded-lg bg-white text-left flex items-center justify-between transition-colors ${
          disabled
            ? 'opacity-75 cursor-not-allowed bg-neutral-50'
            : 'hover:border-neutral-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary'
        }`}
      >
        <span className={selected ? 'text-neutral-900' : 'text-neutral-500'}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="relative">
          <div className="absolute top-1 left-0 right-0 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 space-y-2">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9"
            />
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-neutral-500 px-2 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </div>
              ) : error ? (
                <div className="text-error px-2 py-3">{error}</div>
              ) : items.length === 0 ? (
                <div className="text-neutral-500 px-2 py-3">{emptyText}</div>
              ) : (
                items.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value, opt);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-neutral-50 ${
                      value === opt.value ? 'bg-primary-50 text-primary-700' : ''
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;


