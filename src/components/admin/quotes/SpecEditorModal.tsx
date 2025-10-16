import { useEffect, useState } from 'react';
import { SPEC_EDITOR_OPEN } from '../../../features/quote/specEditorEvents';
import type { SpecData } from '../../../features/quote/quoteAssistantPrompt';
import { supabase } from '../../../lib/supabase';
import { Modal } from '../../shared';
import SpecEditorForm, { type SpecFormData } from './SpecEditorForm';


export function SpecEditorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalData, setModalData] = useState<{
    conversationId: string;
    specData: SpecData;
    language: string;
    sessionId?: string;
  } | null>(null);

  useEffect(() => {
    const handleSpecEditorOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string;
        specData: SpecData;
        language: string;
        sessionId?: string;
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

  const initialFormData: SpecFormData = {
    product_name: modalData.specData.product_name || '',
    service_code: (modalData.specData as any).service_code || '',
    category: modalData.specData.category || '',
    description: modalData.specData.description || '',
    size: modalData.specData.size || '',
    materials: modalData.specData.materials || [],
    color: modalData.specData.color || '',
    finishing: modalData.specData.finishing || [],
    others: (modalData.specData as any).others || [],
    quantity: modalData.specData.quantity || 1,
    artwork: (modalData.specData as any).artwork || '',
    deadline: modalData.specData.deadline || '',
    notes: modalData.specData.notes || '',
    quoted_price: (modalData.specData as any).quoted_price || 0,
    admin_notes: (modalData.specData as any).admin_notes || '',
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 sm:p-5 md:p-6 max-h-[85vh] overflow-y-auto overscroll-contain">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">Review Order Specifications</h2>

        <SpecEditorForm
          initialData={initialFormData}
          loading={isSaving}
          onCancel={() => {
            setIsOpen(false);
            setSaveError(null);
            setSaveSuccess(false);
          }}
          onSubmit={async (data) => {
            if (!data.quoted_price) {
              setSaveError('Quoted price is required');
              return;
            }
            setIsSaving(true);
            setSaveError(null);
            setSaveSuccess(false);
            try {
              // Use RPC with SECURITY DEFINER to bypass RLS
              const { error } = await supabase.rpc('save_quote_spec', {
                p_session_id: modalData.conversationId,
                p_spec_data: data,
              });
              if (error) throw error;
              setSaveSuccess(true);
              try {
                if (modalData.sessionId) {
                  await supabase.rpc('api_insert_chat_message_v2', {
                    p_session_id: modalData.sessionId,
                    p_text: 'Draft saved successfully.',
                    p_role: 'printy',
                    p_node_id: 'wait_for_draft_save',
                  });
                }
              } catch {}
              setTimeout(() => {
                setIsOpen(false);
                setSaveError(null);
                setSaveSuccess(false);
              }, 1200);
            } catch (e: any) {
              console.error('Error saving spec:', e);
              setSaveError(e?.message || 'Failed to save draft');
            } finally {
              setIsSaving(false);
            }
          }}
        />

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
      </div>
    </Modal>
  );
}

export default SpecEditorModal;