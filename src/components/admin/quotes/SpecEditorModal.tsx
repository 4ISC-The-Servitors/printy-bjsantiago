import { useEffect, useState } from 'react';
import { SPEC_EDITOR_OPEN } from '../../../features/quote/specEditorEvents';
import type { SpecData } from '../../../features/quote/quoteAssistantPrompt';
import { supabase } from '../../../lib/supabase';


export function SpecEditorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalData, setModalData] = useState<{
    conversationId: string;
    specData: SpecData;
    language: string;
  } | null>(null);

  useEffect(() => {
    const handleSpecEditorOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string;
        specData: SpecData;
        language: string;
      }>;
      setModalData(customEvent.detail);
      setIsOpen(true);
    };

    window.addEventListener(SPEC_EDITOR_OPEN, handleSpecEditorOpen);
    return () => {
      window.removeEventListener(SPEC_EDITOR_OPEN, handleSpecEditorOpen);
    };
  }, []);

  if (!isOpen || !modalData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Review Order Specifications</h2>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              value={modalData.specData.product_name}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, product_name: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={modalData.specData.category || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, category: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={modalData.specData.description || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, description: e.target.value }
              })}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <input
              type="text"
              value={modalData.specData.size || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, size: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Materials</label>
            <input
              type="text"
              value={modalData.specData.materials?.join(', ') || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, materials: e.target.value.split(',').map(s => s.trim()) }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Separate multiple materials with commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="text"
              value={modalData.specData.color || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, color: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Finishing</label>
            <input
              type="text"
              value={modalData.specData.finishing?.join(', ') || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, finishing: e.target.value.split(',').map(s => s.trim()) }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Separate multiple finishes with commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              value={modalData.specData.quantity || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, quantity: parseInt(e.target.value) }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quoted Price (PHP) - e.g., 1500.00, 2500.50, 5000
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={modalData.specData.quoted_price || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, quoted_price: parseFloat(e.target.value) || 0 }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="1500.00"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the total price in Philippine Pesos (PHP). Use decimal places for cents if needed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input
              type="text"
              value={modalData.specData.deadline || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, deadline: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={modalData.specData.notes || ''}
              onChange={(e) => setModalData({
                ...modalData,
                specData: { ...modalData.specData, notes: e.target.value }
              })}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </form>

        {/* Error/Success Messages */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error saving draft: {saveError}
          </div>
        )}
        
        {saveSuccess && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Draft saved successfully!
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setIsOpen(false);
              setSaveError(null);
              setSaveSuccess(false);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!modalData?.specData.quoted_price) {
                setSaveError('Quoted price is required');
                return;
              }

              setIsSaving(true);
              setSaveError(null);
              setSaveSuccess(false);

              try {
                // Save to quote_specs table
                const { error } = await supabase
                  .from('quote_specs')
                  .insert({
                    conversation_id: modalData.conversationId,
                    spec_data: modalData.specData
                  })
                  .select()
                  .single();

                if (error) throw error;
                
                setSaveSuccess(true);
                setTimeout(() => {
                  setIsOpen(false);
                  setSaveError(null);
                  setSaveSuccess(false);
                }, 1500);
              } catch (error: any) {
                console.error('Error saving spec:', error);
                setSaveError(error.message || 'Failed to save draft');
              } finally {
                setIsSaving(false);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpecEditorModal;