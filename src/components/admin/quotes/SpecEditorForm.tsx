// src/components/admin/quotes/SpecEditorForm.tsx

import React, { useState } from 'react';
import { Button, Input } from '../../shared';
import { useResponsiveClasses, useResponsiveButton } from '../../../hooks/ui';

export interface SpecFormData {
  product_name: string;
  service_code?: string;
  category?: string;
  description?: string;
  size?: string;
  materials: string[];
  color?: string;
  finishing: string[];
  others: string[];
  quantity?: number;
  artwork?: string;
  deadline?: string;
  notes?: string;
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
  loading = false
}) => {
  const [formData, setFormData] = useState<SpecFormData>({
    product_name: '',
    service_code: '',
    category: '',
    description: '',
    size: '',
    materials: [],
    color: '',
    finishing: [],
    others: [],
    quantity: 1,
    artwork: '',
    deadline: '',
    notes: '',
    quoted_price: 0,
    admin_notes: '',
    ...initialData
  });

  const [materialInput, setMaterialInput] = useState('');
  const [finishingInput, setFinishingInput] = useState('');
  const [otherInput, setOtherInput] = useState('');

  const addToArray = (field: keyof SpecFormData, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));
  };

  const removeFromArray = (field: keyof SpecFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const { textClasses } = useResponsiveClasses();
  const { getChatButtonClasses } = useResponsiveButton();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Product Name */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Product Name *
        </label>
        <Input
          value={formData.product_name}
          onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
          placeholder="e.g., Business Cards, Flyers, Banners"
          required
        />
      </div>

      {/* Service Code & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Service Code
          </label>
          <Input
            value={formData.service_code || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, service_code: e.target.value }))}
            placeholder="e.g., BC-001, FL-002"
          />
        </div>
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Category
          </label>
          <Input
            value={formData.category || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., Business Cards, Marketing Materials"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the product requirements"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Size & Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Size
          </label>
          <Input
            value={formData.size || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
            placeholder="e.g., 3.5in x 2in, A4, 24in x 36in"
          />
        </div>
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Quantity
          </label>
          <Input
            type="number"
            value={formData.quantity || 1}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            min="1"
          />
        </div>
      </div>

      {/* Materials */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Materials
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={materialInput}
            onChange={(e) => setMaterialInput(e.target.value)}
            placeholder="Add material (e.g., Cardstock, Vinyl)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('materials', materialInput);
                setMaterialInput('');
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
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
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Color
        </label>
        <Input
          value={formData.color || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          placeholder="e.g., Full Color, Black & White, PMS 286"
        />
      </div>

      {/* Finishing */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Finishing
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={finishingInput}
            onChange={(e) => setFinishingInput(e.target.value)}
            placeholder="Add finishing option (e.g., Glossy, Matte, UV Coating)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('finishing', finishingInput);
                setFinishingInput('');
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
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

      {/* Artwork & Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Artwork
          </label>
          <Input
            value={formData.artwork || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, artwork: e.target.value }))}
            placeholder="e.g., Customer provided, Design needed"
          />
        </div>
        <div>
          <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
            Deadline
          </label>
          <Input
            value={formData.deadline || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            placeholder="e.g., 2024-01-15, ASAP, 3 days"
          />
        </div>
      </div>

      {/* Others */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Additional Details
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={otherInput}
            onChange={(e) => setOtherInput(e.target.value)}
            placeholder="Add additional detail"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('others', otherInput);
                setOtherInput('');
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              addToArray('others', otherInput);
              setOtherInput('');
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {formData.others.map((other, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
            >
              {other}
              <button
                type="button"
                onClick={() => removeFromArray('others', index)}
                className="ml-1 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Quote Price */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Quote Price (PHP) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            ₱
          </span>
          <Input
            type="number"
            value={formData.quoted_price}
            onChange={(e) => setFormData(prev => ({ ...prev, quoted_price: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            className="pl-8"
          />
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Admin Notes
        </label>
        <textarea
          value={formData.admin_notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
          placeholder="Internal notes for this quote"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={`block ${textClasses.caption} font-medium text-gray-700 mb-1`}>
          Customer Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notes to include in the quote for customer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          rows={3}
        />
      </div>

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
