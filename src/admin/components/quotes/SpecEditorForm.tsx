// src/components/admin/quotes/SpecEditorForm.tsx

import React, { useCallback, useState } from 'react';
import { Button, Input } from '@admin/components/shared';
import SearchableSelect from '@shared/components/ui/SearchableSelect';
import {
  formatPriceInput,
  extractNumericValue,
} from '@shared/utils/priceFormatter';
import { useResponsiveClasses, useResponsiveButton } from '@shared/hooks/ui';
import {
  categoryOptions,
  serviceOptions,
} from '@/features/chat/api/servicesApi';

export interface SpecFormData {
  product_name: string;
  service_id?: string; // printing_services.display_id
  category?: string;
  description?: string;
  size?: string;
  materials: string;
  color?: string;
  finishing: string;
  quantity?: number;
  deadline?: string;
  delivery_method?: string;
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
    materials: '',
    color: '',
    finishing: '',
    quantity: 1,
    deadline: '',
    delivery_method: '',
    quoted_price: 0,
    admin_notes: '',
    ...initialData,
  });

  // Track selected IDs for SearchableSelect components
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    formData.category || ''
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    formData.service_id || ''
  );

  // Sync selected IDs when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setSelectedCategoryId(initialData.category || '');
      setSelectedServiceId(initialData.service_id || '');
    }
  }, [initialData]);

  // Fetchers bound to current selection
  const fetchCategories = useCallback((q: string) => categoryOptions(q), []);
  const fetchServices = useCallback(
    (q: string) => serviceOptions(selectedCategoryId, q),
    [selectedCategoryId]
  );

  // Derive disabled state
  const serviceDisabled = !selectedCategoryId;

  // Materials and finishing are free-text string inputs

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
        {/* Category SearchableSelect */}
        <SearchableSelect
          label="Category"
          value={selectedCategoryId}
          onChange={_value => {
            setSelectedCategoryId(_value);
            setSelectedServiceId('');
            setFormData(prev => ({
              ...prev,
              category: _value,
              service_id: '',
            }));
          }}
          fetchOptions={fetchCategories}
          placeholder="Select category"
        />

        {/* Service SearchableSelect */}
        <SearchableSelect
          label="Service Name"
          value={selectedServiceId}
          onChange={_value => {
            setSelectedServiceId(_value);
            setFormData(prev => ({
              ...prev,
              service_id: _value,
            }));
          }}
          fetchOptions={fetchServices}
          placeholder={
            serviceDisabled ? 'Select category first' : 'Select service'
          }
          disabled={serviceDisabled}
        />
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
        <Input
          value={formData.materials || ''}
          onChange={e =>
            setFormData(prev => ({ ...prev, materials: e.target.value }))
          }
          placeholder="e.g., Cardstock, Vinyl, Glossy Paper"
        />
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
        <Input
          value={formData.finishing || ''}
          onChange={e =>
            setFormData(prev => ({ ...prev, finishing: e.target.value }))
          }
          placeholder="e.g., Glossy, Matte, UV Coating, Lamination"
        />
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

      {/* Delivery Method */}
      <div>
        <label
          className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}
        >
          Delivery Method
        </label>
        <Input
          value={formData.delivery_method || ''}
          onChange={e =>
            setFormData(prev => ({ ...prev, delivery_method: e.target.value }))
          }
          placeholder="e.g., Pick-up, Delivery, Courier, Same-day delivery"
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
              if (
                isDot &&
                (e.currentTarget.value.includes('.') ||
                  quotedPriceInput.includes('.'))
              ) {
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
