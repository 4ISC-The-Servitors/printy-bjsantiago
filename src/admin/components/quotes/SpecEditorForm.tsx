// src/components/admin/quotes/SpecEditorForm.tsx

import React, { useState } from 'react';
import { Button, Input } from '@admin/components/shared';
import { ChevronDown } from 'lucide-react';
import { formatPriceInput, extractNumericValue } from '@shared/utils/priceFormatter';
import { useResponsiveClasses, useResponsiveButton } from '@shared/hooks/ui';

export interface SpecFormData {
  product_name: string;
  service_id?: string; // printing_services.display_id
  category?: string;
  description?: string;
  size?: string;
  materials: string[];
  color?: string;
  finishing: string[];
  quantity?: number;
  deadline?: string;
  quoted_price: number;
  admin_notes?: string;
}

interface SpecEditorFormProps {
  initialData?: SpecFormData;
  onSubmit: (data: SpecFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  onChange?: (data: SpecFormData) => void;
}

const SpecEditorForm: React.FC<SpecEditorFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  onChange,
}) => {
  const [formData, setFormData] = useState<SpecFormData>({
    product_name: '',
    service_id: '',
    category: '',
    description: '',
    size: '',
    materials: [],
    color: '',
    finishing: [],
    quantity: 1,
    deadline: '',
    quoted_price: 0,
    admin_notes: '',
    ...initialData,
  });


  // Services & Categories dropdown state
  const [categories, setCategories] = useState<Array<{ category_id: string; category_name: string }>>([]);
  const [services, setServices] = useState<Array<{ display_id: string; service_name: string }>>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const categoryRef = React.useRef<HTMLDivElement>(null);
  const serviceRef = React.useRef<HTMLDivElement>(null);

  // Load active categories on mount
  React.useEffect(() => {
    import('@/features/chat/api/servicesApi').then(async api => {
      const cats = await api.getActiveCategories();
      setCategories(cats.map((c: any) => ({ category_id: c.category_id, category_name: c.category_name })));
    }).catch(() => {});
  }, []);

  // Load services when category changes
  React.useEffect(() => {
    const catId = formData.category || '';
    if (!catId) {
      setServices([]);
      return;
    }
    setLoadingServices(true);
    import('@/features/chat/api/servicesApi').then(async api => {
      const list = await api.getActiveServicesByCategory(catId);
      setServices(list);
    }).finally(() => setLoadingServices(false));
  }, [formData.category]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (serviceRef.current && !serviceRef.current.contains(e.target as Node)) {
        setIsServiceOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Removed array add/remove helpers in favor of free-text inputs (comma-separated)

  const [quotedPriceInput, setQuotedPriceInput] = useState<string>(
    formData.quoted_price ? formatPriceInput(String(formData.quoted_price)) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = extractNumericValue(quotedPriceInput || '');
    onSubmit({ ...formData, quoted_price: numeric });
  };

  // Notify parent of form changes to preserve state across minimize/reopen
  React.useEffect(() => {
    if (!onChange) return;
    onChange({ ...formData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const { textClasses } = useResponsiveClasses();
  const { getChatButtonClasses } = useResponsiveButton();

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-5 md:space-y-6"
    >
      {/* Product Name */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Product Name *
        </label>
        <Input
          value={formData.product_name}
          onChange={e =>
            setFormData(prev => ({ ...prev, product_name: e.target.value }))
          }
          placeholder="e.g., Business Cards, Flyers, Banners"
          required
        />
      </div>

      {/* Category & Service ID (filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Category dropdown (Filter-style) */}
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Category
          </label>
          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setIsCategoryOpen(v => !v)}
              className="w-full flex items-center justify-between h-9 sm:h-10 px-2 sm:px-3 md:px-4 text-sm bg-white border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <span className="text-neutral-700 truncate">
                {(() => {
              const selected = categories.find(c => c.category_id === (formData.category || ''));
                  return selected ? selected.category_name : 'Select category';
            })()}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCategoryOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                {categories.length === 0 && (
                  <div className="px-3 py-2 text-sm text-neutral-500">No categories</div>
                )}
                {categories.map(c => (
                  <button
                    key={c.category_id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, category: c.category_id, service_id: '' }));
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${formData.category === c.category_id ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'}`}
                  >
                    {c.category_name}
                  </button>
            ))}
              </div>
            )}
          </div>
        </div>

        {/* Service dropdown (Filter-style, depends on category) */}
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Service Name
          </label>
          <div className="relative" ref={serviceRef}>
            <button
              type="button"
              onClick={() => {
                if (!formData.category || loadingServices) return;
                setIsServiceOpen(v => !v);
              }}
            disabled={!formData.category || loadingServices}
              className={`w-full flex items-center justify-between h-9 sm:h-10 px-2 sm:px-3 md:px-4 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${!formData.category || loadingServices ? 'border-neutral-200 text-neutral-400 cursor-not-allowed' : 'border-neutral-300 hover:border-neutral-400 focus:ring-primary-500 focus:border-transparent'}`}
            >
              <span className={`truncate ${!formData.category || loadingServices ? 'text-neutral-400' : 'text-neutral-700'}`}>
                {loadingServices
                  ? 'Loading services…'
                  : formData.service_id
                  ? (() => {
                      const s = services.find(x => x.display_id === formData.service_id);
                      return s ? `${s.display_id} (${s.service_name})` : formData.service_id;
                    })()
                  : 'Select service'}
              </span>
              <ChevronDown className={`w-4 h-4 ${!formData.category || loadingServices ? 'text-neutral-300' : 'text-neutral-400'} transition-transform ${isServiceOpen ? 'rotate-180' : ''}`} />
            </button>
            {isServiceOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                {services.length === 0 && (
                  <div className="px-3 py-2 text-sm text-neutral-500">No services</div>
                )}
            {services.map(s => (
                  <button
                    key={s.display_id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, service_id: s.display_id }));
                      setIsServiceOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${formData.service_id === s.display_id ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'}`}
                  >
                    {`${s.display_id} (${s.service_name})`}
                  </button>
            ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          placeholder="Detailed description of the product requirements"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Size & Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label
            className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
          >
            Size
          </label>
          <Input
            value={formData.size || ''}
            onChange={e =>
              setFormData(prev => ({ ...prev, size: e.target.value }))
            }
            placeholder="e.g., 3.5in x 2in, A4, 24in x 36in"
          />
        </div>
        <div>
          <label
            className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
          >
            Quantity
          </label>
          <Input
            type="number"
            value={formData.quantity || 1}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                quantity: parseInt(e.target.value) || 1,
              }))
            }
            min="1"
          />
        </div>
      </div>

      {/* Materials (free-text, comma-separated) */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Materials
        </label>
        <div className="w-full">
          <Input
            value={(formData.materials || []).join(', ')}
            onChange={e => {
              const parts = e.target.value
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);
              setFormData(prev => ({ ...prev, materials: parts }));
            }}
            placeholder="Comma-separated (e.g., Cardstock, Vinyl)"
            className="w-full"
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Color
        </label>
        <Input
          value={formData.color || ''}
          onChange={e =>
            setFormData(prev => ({ ...prev, color: e.target.value }))
          }
          placeholder="e.g., Full Color, Black & White, PMS 286"
        />
      </div>

      {/* Finishing (free-text, comma-separated) */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Finishing
        </label>
        <div className="w-full">
          <Input
            value={(formData.finishing || []).join(', ')}
            onChange={e => {
              const parts = e.target.value
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);
              setFormData(prev => ({ ...prev, finishing: parts }));
            }}
            placeholder="Comma-separated (e.g., Glossy, Matte, UV Coating)"
            className="w-full"
          />
        </div>
      </div>

      {/* Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label
            className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
          >
            Deadline
          </label>
          <Input
            value={formData.deadline || ''}
            onChange={e =>
              setFormData(prev => ({ ...prev, deadline: e.target.value }))
            }
            placeholder="e.g., 2024-01-15, ASAP, 3 days"
          />
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Admin Notes
        </label>
        <textarea
          value={formData.admin_notes || ''}
          onChange={e =>
            setFormData(prev => ({ ...prev, admin_notes: e.target.value }))
          }
          placeholder="Internal notes for this quote"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Quote Price (moved to bottom) */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Quote Price (₱) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            ₱
          </span>
          <Input
            type="text"
            value={quotedPriceInput}
            onChange={e => {
              const formatted = formatPriceInput(e.target.value);
              setQuotedPriceInput(formatted);
              setFormData(prev => ({
                ...prev,
                quoted_price: extractNumericValue(formatted),
              }));
            }}
            onKeyDown={e => {
              const allowed = [
                'Backspace',
                'Delete',
                'ArrowLeft',
                'ArrowRight',
                'Home',
                'End',
                'Tab',
              ];
              if (allowed.includes(e.key)) return;
              const isNumber = /[0-9]/.test(e.key);
              const isDot = e.key === '.';
              if (!isNumber && !isDot) {
                e.preventDefault();
                return;
              }
              if (isDot && (e.currentTarget.value.includes('.') || quotedPriceInput.includes('.'))) {
                // Prevent multiple decimals in the raw input
                e.preventDefault();
              }
            }}
            onWheel={e => (e.currentTarget as HTMLInputElement).blur()}
            placeholder="₱0"
            inputMode="numeric"
            required
            className="pl-8"
          />
        </div>
      </div>

      {/* Admin Notes (visible to customer) */}

      {/* Actions */}
      <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
        <Button
          type="button"
          variant="secondary"
          className={getChatButtonClasses('sm')}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className={getChatButtonClasses('sm')}
          loading={loading}
        >
          Save Quote
        </Button>
      </div>
    </form>
  );
};

export default SpecEditorForm;
