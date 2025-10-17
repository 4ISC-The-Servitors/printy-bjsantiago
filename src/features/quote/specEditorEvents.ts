// Event system for spec editor modal

export const SPEC_EDITOR_OPEN = 'spec-editor-open';

export function openSpecEditor(params: {
  conversationId: string;
  specData: any;
  language: string;
  sessionId?: string;
}) {
  const event = new CustomEvent(SPEC_EDITOR_OPEN, {
    detail: params,
  });
  window.dispatchEvent(event);
}
