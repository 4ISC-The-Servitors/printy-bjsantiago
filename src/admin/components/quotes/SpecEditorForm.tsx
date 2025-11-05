// src/components/admin/quotes/SpecEditorForm.tsx

import React, { useState } from 'react';
import { Button, Input } from '@admin/components/shared';
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
}

const SpecEditorForm: React.FC<SpecEditorFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
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

  const [materialInput, setMaterialInput] = useState('');
  const [finishingInput, setFinishingInput] = useState('');

  // Services & Categories dropdown state
  const [categories, setCategories] = useState<Array<{ category_id: string; category_name: string }>>([]);
  const [services, setServices] = useState<Array<{ display_id: string; service_name: string }>>([]);
  const [loadingServices, setLoadingServices] = useState(false);

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

  const addToArray = (field: keyof SpecFormData, value: string) => {
    if (!value.trim()) return;
    // Support comma-separated batch add, trim and dedupe
    const parts = value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    setFormData(prev => {
      const current = new Set<string>([...((prev[field] as string[]) || [])]);
      parts.forEach(p => current.add(p));
      return {
        ...prev,
        [field]: Array.from(current),
      } as SpecFormData;
    });
  };

  const removeFromArray = (field: keyof SpecFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const [quotedPriceInput, setQuotedPriceInput] = useState<string>(
    formData.quoted_price ? formatPriceInput(String(formData.quoted_price)) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = extractNumericValue(quotedPriceInput || '');
    onSubmit({ ...formData, quoted_price: numeric });
  };

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
        {/* Category dropdown */}
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Category
          </label>
          <input
            list="spec-cat-list"
            className="w-full h-9 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Type to search categories..."
            value={(() => {
              const selected = categories.find(c => c.category_id === (formData.category || ''));
              return selected ? selected.category_name : '';
            })()}
            onChange={e => {
              const raw = e.target.value;
              // Expect value as "Name ||| UUID" from datalist; fallback to name lookup
              if (raw.includes('|||')) {
                const parts = raw.split('|||');
                const id = parts[1];
                setFormData(prev => ({ ...prev, category: id, service_id: '' }));
              } else {
                const match = categories.find(c => c.category_name.toLowerCase() === raw.toLowerCase());
                setFormData(prev => ({ ...prev, category: match?.category_id || '', service_id: '' }));
              }
            }}
            required
          />
          <datalist id="spec-cat-list">
            {categories.map(c => (
              <option key={c.category_id} value={`${c.category_name}|||${c.category_id}`}>{c.category_name}</option>
            ))}
          </datalist>
        </div>

        {/* Service ID dropdown filtered by category */}
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Service ID
          </label>
          <input
            list="spec-service-list"
            className="w-full h-9 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder={loadingServices ? 'Loading services…' : 'Type to search services...'}
            disabled={!formData.category || loadingServices}
            value={formData.service_id || ''}
            onChange={e => {
              const raw = e.target.value;
              // We set option values to display_id, so we can assign directly
              setFormData(prev => ({ ...prev, service_id: raw }));
            }}
            required
          />
          <datalist id="spec-service-list">
            {services.map(s => (
              <option key={s.display_id} value={s.display_id}>{`${s.display_id} (${s.service_name})`}</option>
            ))}
          </datalist>
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

      {/* Materials */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Materials
        </label>
        <div className="flex w-full gap-2 mb-2">
          <Input
            value={materialInput}
            onChange={e => setMaterialInput(e.target.value)}
            placeholder="Add material (e.g., Cardstock, Vinyl)"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('materials', materialInput);
                setMaterialInput('');
              }
            }}
            className="flex-1 min-w-0"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={() => {
              addToArray('materials', materialInput);
              setMaterialInput('');
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {formData.materials.map((material, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {material}
              <button
                type="button"
                onClick={() => removeFromArray('materials', index)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
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

      {/* Finishing */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Finishing
        </label>
        <div className="flex w-full gap-2 mb-2">
          <Input
            value={finishingInput}
            onChange={e => setFinishingInput(e.target.value)}
            placeholder="Add finishing option (e.g., Glossy, Matte, UV Coating)"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('finishing', finishingInput);
                setFinishingInput('');
              }
            }}
            className="flex-1 min-w-0"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={() => {
              addToArray('finishing', finishingInput);
              setFinishingInput('');
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {formData.finishing.map((finish, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
            >
              {finish}
              <button
                type="button"
                onClick={() => removeFromArray('finishing', index)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
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
