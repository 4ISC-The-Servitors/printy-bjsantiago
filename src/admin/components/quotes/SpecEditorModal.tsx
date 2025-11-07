import { useEffect, useState } from 'react';
import { SPEC_EDITOR_OPEN } from '@/features/chat/helpers/specEditorEvents';
import type { SpecData } from '@/features/chat/helpers/quoteAssistantPrompt';
import { supabase } from '@lib/supabase';
import { Modal } from '@admin/components/shared';
import SpecEditorForm, { type SpecFormData } from './SpecEditorForm';
import { Minus } from 'lucide-react';

export function SpecEditorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draftData, setDraftData] = useState<SpecFormData | null>(null);
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
      // Initialize draft if empty
      try {
        const init: SpecFormData = {
          product_name: customEvent.detail.specData.product_name || '',
          service_id:
            (customEvent.detail.specData as any).service_id ||
            (customEvent.detail.specData as any).service_code ||
            '',
          category: customEvent.detail.specData.category || '',
          description: (() => {
            const desc = customEvent.detail.specData.description || '';
            const legacyNotes =
              (customEvent.detail.specData as any).notes || '';
            const legacyArtwork =
              (customEvent.detail.specData as any).artwork || '';
            const legacyOthers =
              (customEvent.detail.specData as any).others || [];
            const extras = [
              legacyNotes,
              legacyArtwork,
              Array.isArray(legacyOthers) ? legacyOthers.join('\n') : '',
            ]
              .filter(Boolean)
              .join('\n');
            return extras ? (desc ? `${desc}\n${extras}` : extras) : desc;
          })(),
          size: customEvent.detail.specData.size || '',
          materials: customEvent.detail.specData.materials || [],
          color: customEvent.detail.specData.color || '',
          finishing: customEvent.detail.specData.finishing || [],
          quantity: customEvent.detail.specData.quantity || 1,
          deadline: customEvent.detail.specData.deadline || '',
          quoted_price: (customEvent.detail.specData as any).quoted_price || 0,
          admin_notes: (customEvent.detail.specData as any).admin_notes || '',
        };
        setDraftData(prev => prev ?? init);
      } catch {}
      try {
        window.dispatchEvent(new Event('spec-editor-reopened'));
      } catch {}
    };

    window.addEventListener(SPEC_EDITOR_OPEN, handleSpecEditorOpen);
    const handleExternalReopen = () => {
      setIsOpen(true);
      try {
        window.dispatchEvent(new Event('spec-editor-reopened'));
      } catch {}
    };
    window.addEventListener('spec-editor-reopen', handleExternalReopen);
    return () => {
      window.removeEventListener(SPEC_EDITOR_OPEN, handleSpecEditorOpen);
      window.removeEventListener('spec-editor-reopen', handleExternalReopen);
    };
  }, []);

  if (!isOpen || !modalData) return null;

  const initialFormData: SpecFormData = {
    product_name: modalData.specData.product_name || '',
    service_id:
      (modalData.specData as any).service_id ||
      (modalData.specData as any).service_code ||
      '',
    category: modalData.specData.category || '',
    description: (() => {
      const desc = modalData.specData.description || '';
      const legacyNotes = (modalData.specData as any).notes || '';
      const legacyArtwork = (modalData.specData as any).artwork || '';
      const legacyOthers = (modalData.specData as any).others || [];
      const extras = [
        legacyNotes,
        legacyArtwork,
        Array.isArray(legacyOthers) ? legacyOthers.join('\n') : '',
      ]
        .filter(Boolean)
        .join('\n');
      return extras ? (desc ? `${desc}\n${extras}` : extras) : desc;
    })(),
    size: modalData.specData.size || '',
    materials: modalData.specData.materials || [],
    color: modalData.specData.color || '',
    finishing: modalData.specData.finishing || [],
    quantity: modalData.specData.quantity || 1,
    deadline: modalData.specData.deadline || '',
    quoted_price: (modalData.specData as any).quoted_price || 0,
    admin_notes: (modalData.specData as any).admin_notes || '',
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          try {
            window.dispatchEvent(new Event('spec-editor-hidden'));
          } catch {}
        }}
        size="sm"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 sm:p-5 max-h-[80vh] overflow-y-auto overscroll-contain w-[min(640px,90vw)] mx-auto">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">
              Review Order Specifications
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  try {
                    window.dispatchEvent(new Event('spec-editor-minimized'));
                  } catch {}
                }}
                className="h-8 w-8 p-0 rounded-full border border-neutral-300 hover:bg-neutral-50 flex items-center justify-center"
                aria-label="Minimize"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <SpecEditorForm
            initialData={draftData ?? initialFormData}
            loading={isSaving}
            onCancel={() => {
              setIsOpen(false);
              setSaveError(null);
              setSaveSuccess(false);
            }}
            onChange={setDraftData}
            onSubmit={async data => {
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
                  setDraftData(null);
                  try {
                    window.dispatchEvent(new Event('spec-editor-hidden'));
                  } catch {}
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
    </>
  );
}

export default SpecEditorModal;
