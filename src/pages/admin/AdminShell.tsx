import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/admin/dashboard';
import { Text, Button } from '../../components/shared';
import ChatDock from '../../components/shared/ChatDock';
import type { ChipItem } from '../../components/shared/SelectedChipsBar';
import ChatPanel from '../../components/chat/CustomerChatPanel';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '../../components/chat/_shared/types';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { AdminProvider } from './AdminContext';
import type { ChatPrefill } from './AdminContext';
import { resolveAdminFlow, dispatchAdminCommand } from '../../chatLogic/admin';
import { supabase } from '../../lib/supabase';

const AdminShellDesktop: React.FC<{
  active: 'dashboard' | 'orders' | 'portfolio' | 'settings';
  go: (route: 'dashboard' | 'orders' | 'portfolio' | 'settings') => void;
  handleLogout: () => void;
}> = ({ active, go, handleLogout }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      <Sidebar active={active} onNavigate={go} onLogout={handleLogout} />
      <div className="flex-1 hidden lg:flex">
        <Outlet />
      </div>
    </div>
  );
};

const AdminShellMobile: React.FC<{
  active: 'dashboard' | 'orders' | 'portfolio' | 'settings';
  go: (route: 'dashboard' | 'orders' | 'portfolio' | 'settings') => void;
  handleLogout: () => void;
}> = ({ active, go, handleLogout }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      <Sidebar active={active} onNavigate={go} onLogout={handleLogout} />
      <div className="flex-1 lg:hidden">
        <Outlet />
      </div>
    </div>
  );
};

const AdminShell: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<
    'dashboard' | 'orders' | 'portfolio' | 'settings'
  >('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [selected, setSelected] = useState<ChipItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [pendingAction, setPendingAction] = useState<null | 'resolution' | 'assign'>(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);
  const [inputPlaceholder, setInputPlaceholder] = useState<string | undefined>(undefined);

  const setTicketActionReplies = () =>
    setQuickReplies([
      { id: 'qr-res', label: 'Create Resolution comment', value: 'Create Resolution comment' },
      { id: 'qr-status', label: 'Change Status', value: 'Change Status' },
      { id: 'qr-assign', label: 'Assign to', value: 'Assign to' },
    ]);

  const handleAdminQuickReply = async (v: string) => {
    const val = v.trim();
    // Intercept status choices immediately to avoid flowing into generic admin flow
    if ((['Open', 'Pending', 'Closed'] as string[]).includes(val)) {
      if (!currentInquiryId) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: 'No ticket is currently selected.', ts: Date.now() },
        ]);
        return;
      }
      const dbStatus = (
        {
          Open: 'open',
          Pending: 'in_progress', // map UI "Pending" to DB enum/value
          Closed: 'closed',
        } as const
      )[val];
      const { error } = await supabase
        .from('inquiries')
        .update({ inquiry_status: dbStatus })
        .eq('inquiry_id', currentInquiryId);
      if (error) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: `Failed to update status: ${error.message}`, ts: Date.now() },
        ]);
        return;
      }
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: `Status updated to ${val}.`, ts: Date.now() },
      ]);
      setPendingAction(null);
      setInputPlaceholder(undefined);
      setTicketActionReplies();
      return;
    }
    if (val === 'Create Resolution comment') {
      setPendingAction('resolution');
      setInputPlaceholder('Type the resolution comment to send to the customer…');
      setQuickReplies([{ id: 'qr-cancel', label: 'Cancel', value: 'Cancel' }]);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: 'Please type the resolution comment.', ts: Date.now() },
      ]);
      return;
    }
    if (val === 'Assign to') {
      setPendingAction('assign');
      setInputPlaceholder('Enter the staff name to assign…');
      setQuickReplies([{ id: 'qr-cancel', label: 'Cancel', value: 'Cancel' }]);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: 'Who should resolve this ticket? Type the staff name.', ts: Date.now() },
      ]);
      return;
    }
    if (val === 'Change Status') {
      setPendingAction('status' as any);
      setInputPlaceholder(undefined);
      setQuickReplies([
        { id: 'qr-open', label: 'Open', value: 'Open' },
        { id: 'qr-pending', label: 'Pending', value: 'Pending' },
        { id: 'qr-closed', label: 'Closed', value: 'Closed' },
        { id: 'qr-back', label: 'Back', value: 'Back' },
      ]);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: 'Select the new status: Open, Pending, or Closed.', ts: Date.now() },
      ]);
      return;
    }
    if (val === 'Back') {
      setPendingAction(null);
      setInputPlaceholder(undefined);
      setTicketActionReplies();
      return;
    }
    if ((pendingAction as any) === 'status' && (['Open','Pending','Closed'] as string[]).includes(val)) {
      if (!currentInquiryId) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: 'No ticket is currently selected.', ts: Date.now() },
        ]);
        return;
      }
      const dbStatus = val.toLowerCase();
      const { error } = await supabase
        .from('inquiries')
        .update({ inquiry_status: dbStatus })
        .eq('inquiry_id', currentInquiryId);
      if (error) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: `Failed to update status: ${error.message}`, ts: Date.now() },
        ]);
        return;
      }
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: `Status updated to ${val}.`, ts: Date.now() },
      ]);
      setPendingAction(null);
      setInputPlaceholder(undefined);
      setTicketActionReplies();
      return;
    }
    // Prevent any stray 'End Chat' flow option from closing the chat
    if (val.toLowerCase() === 'end chat') {
      // ignore
      return;
    }
    // Prevent stray flow command from ending the chat
    if (val.toLowerCase() === 'end chat') return;
    // fallback to existing flow
    const dispatched = dispatchAdminCommand(val);
    if (dispatched) {
      const d = (await dispatched) as { messages?: { role: string; text: string }[]; quickReplies?: string[] };
      const botMessages = (d.messages || []).map(m => ({ id: crypto.randomUUID(), role: m.role as ChatRole, text: m.text, ts: Date.now() }));
      setMessages(prev => [...prev, ...botMessages]);
      setQuickReplies((d.quickReplies || []).map((l, index) => ({ id: `qr-${index}`, label: l, value: l })));
      setIsTyping(false);
    }
  };

  const handleAdminSend = async (text: string) => {
    const trimmed = text.trim();
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    if (pendingAction === 'resolution') {
      if (!currentInquiryId) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: 'No ticket is currently selected.', ts: Date.now() },
        ]);
        return;
      }
      const { error } = await supabase
        .from('inquiries')
        .update({ resolution_comments: trimmed })
        .eq('inquiry_id', currentInquiryId);
      if (error) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: `Failed to save resolution: ${error.message}`, ts: Date.now() },
        ]);
        return;
      }
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: 'Resolution comment saved and sent to the customer.', ts: Date.now() },
      ]);
      setPendingAction(null);
      setInputPlaceholder(undefined);
      setTicketActionReplies();
      return;
    }
    if (pendingAction === 'assign') {
      if (!currentInquiryId) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: 'No ticket is currently selected.', ts: Date.now() },
        ]);
        return;
      }
      const { error } = await supabase
        .from('inquiries')
        .update({ assigned_to: trimmed })
        .eq('inquiry_id', currentInquiryId);
      if (error) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'printy', text: `Failed to assign ticket: ${error.message}`, ts: Date.now() },
        ]);
        return;
      }
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'printy', text: `Ticket assigned to ${trimmed}.`, ts: Date.now() },
      ]);
      setPendingAction(null);
      setInputPlaceholder(undefined);
      setTicketActionReplies();
      return;
    }
    // default behavior: existing flow
    setIsTyping(true);
    const dispatched = dispatchAdminCommand(text);
    if (dispatched) {
      const d = (await dispatched) as { messages?: { role: string; text: string }[]; quickReplies?: string[] };
      const botMessages = (d.messages || []).map(m => ({ id: crypto.randomUUID(), role: m.role as ChatRole, text: m.text, ts: Date.now() }));
      setMessages(prev => [...prev, ...botMessages]);
      setQuickReplies((d.quickReplies || []).map((l, index) => ({ id: `qr-${index}`, label: l, value: l })));
      setIsTyping(false);
    }
  };

  const go = (route: typeof active) => {
    setActive(route);
    if (route === 'dashboard') navigate('/admin');
    if (route === 'orders') navigate('/admin/orders');
    if (route === 'portfolio') navigate('/admin/portfolio');
    if (route === 'settings') navigate('/admin/settings');
  };

  const handleLogout = () => {
    navigate('/auth/signin');
  };
  const endChatWithDelay = () => {
    const endMessage = {
      id: crypto.randomUUID(),
      role: 'printy' as const,
      text: 'Thank you for chatting with Printy! Have a great day. 👋',
      ts: Date.now(),
    };
    setMessages(prev => [...prev, endMessage]);
    setQuickReplies([]);
    setTimeout(() => {
      setChatOpen(false);
      setMessages([]);
    }, 2000);
  };

  return (
    <AdminProvider
      value={{
        selected,
        addSelected: (item: ChipItem) =>
          setSelected(prev =>
            prev.find(i => i.id === item.id) ? prev : [...prev, item]
          ),
        removeSelected: (id: string) =>
          setSelected(prev => prev.filter(i => i.id !== id)),
        clearSelected: () => setSelected([]),
        openChat: (prefill?: string | ChatPrefill) => {
          setChatOpen(true);
          if (prefill) {
            const payload = typeof prefill === 'string' ? { text: prefill } : prefill;
            const role = (payload.role || 'printy') as ChatRole;
            const pre = {
              id: crypto.randomUUID(),
              role,
              text: payload.text,
              ts: Date.now(),
            };
            setMessages(prev => (prev.length === 0 ? [pre] : [...prev, pre]));
            if (typeof prefill === 'object' && prefill.context?.inquiryId) {
              setCurrentInquiryId(prefill.context.inquiryId);
              setPendingAction(null);
              setInputPlaceholder(undefined);
              setTicketActionReplies();
            }
          }
          if (!(typeof prefill === 'object' && prefill?.skipIntro) && messages.length === 0) {
            const flow = resolveAdminFlow('intro');
            if (!flow) return;
            const initial = flow.initial({});
            setMessages(prev => [
              ...prev,
              ...initial.map(m => ({
                id: crypto.randomUUID(),
                role: m.role as ChatRole,
                text: m.text,
                ts: Date.now(),
              })),
            ]);
            setQuickReplies(
              flow.quickReplies().map((l, index) => ({
                id: `qr-${index}`,
                label: l,
                value: l,
              }))
            );
          }
          if (typeof prefill === 'object' && prefill?.followupBotText) {
            const msg = {
              id: crypto.randomUUID(),
              role: 'printy' as ChatRole,
              text: prefill.followupBotText,
              ts: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
          }
        },
      }}
    >
      <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
        <Sidebar active={active} onNavigate={go} onLogout={handleLogout} />

        <main
          className={`flex-1 flex flex-col ${chatOpen ? 'lg:pr-[420px]' : ''} pl-16 overflow-y-auto scrollbar-hide`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between relative">
              <Text
                variant="h1"
                size="2xl"
                weight="bold"
                className="text-neutral-900"
              >
                Admin
              </Text>
              <div className="flex items-center gap-2">
                {/* Mobile/Tablet toggle button (icon only) */}
                {/* When chat open on mobile, show Hide and Close buttons; else show open button */}
                {chatOpen ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      threeD
                      className="lg:hidden"
                      onClick={() => setChatOpen(false)}
                      aria-label="Hide chat"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      threeD
                      className="lg:hidden"
                      onClick={endChatWithDelay}
                      aria-label="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    threeD
                    className="lg:hidden"
                    onClick={() => {
                      setChatOpen(true);
                      if (messages.length === 0) {
                        const flow = resolveAdminFlow('intro');
                        if (!flow) return;
                        const initial = flow.initial({});
                        setMessages(
                          initial.map(m => ({
                            id: crypto.randomUUID(),
                            role: m.role as ChatRole,
                            text: m.text,
                            ts: Date.now(),
                          }))
                        );
                        setQuickReplies(
                          flow.quickReplies().map((l, index) => ({
                            id: `qr-${index}`,
                            label: l,
                            value: l,
                          }))
                        );
                      }
                    }}
                    aria-label="Ask Printy"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                )}

                {/* Desktop button with icon only */}
                <Button
                  variant="secondary"
                  size="sm"
                  threeD
                  className="hidden lg:inline-flex"
                  onClick={() => {
                    setChatOpen(true);
                    if (messages.length === 0) {
                      const flow = resolveAdminFlow('intro');
                      if (!flow) return;
                      const initial = flow.initial({});
                      setMessages(
                        initial.map(m => ({
                          id: crypto.randomUUID(),
                          role: m.role as ChatRole,
                          text: m.text,
                          ts: Date.now(),
                        }))
                      );
                      setQuickReplies(
                        flow.quickReplies().map((l, index) => ({
                          id: `qr-${index}`,
                          label: l,
                          value: l,
                        }))
                      );
                    }
                  }}
                  aria-label="Ask Printy"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* On small screens, show chat full-width when open */}
            <div
              className={`lg:hidden ${chatOpen ? 'flex' : 'hidden'} flex-col min-h-screen bg-white`}
            >
              <ChatPanel
                title="Printy Assistant"
                messages={messages}
                onSend={handleAdminSend}
                isTyping={isTyping}
                quickReplies={quickReplies}
                inputPlaceholder={inputPlaceholder}
                onQuickReply={handleAdminQuickReply}
                onEndChat={() => setChatOpen(false)}
              />
            </div>
            {/* Route outlet wrapped by platform-specific shells */}
            <div className="hidden lg:block">
              <AdminShellDesktop
                active={active}
                go={go}
                handleLogout={handleLogout}
              />
            </div>
            <div className="lg:hidden">
              <AdminShellMobile
                active={active}
                go={go}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </main>

        {/* Desktop Chat Dock; on mobile, chat occupies content area */}
        {/* Desktop dock with its own compact header (icons) */}
        <ChatDock
          open={chatOpen}
          onToggle={() => setChatOpen(false)}
          selected={selected}
          onRemoveSelected={id =>
            setSelected(prev => prev.filter(i => i.id !== id))
          }
          onClearSelected={() => setSelected([])}
          header={
            <div className="hidden lg:flex items-center justify-between">
              <Text variant="h3" size="lg" weight="semibold">
                Printy Assistant
              </Text>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  threeD
                  aria-label="Hide chat"
                  onClick={() => setChatOpen(false)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  threeD
                  aria-label="Close chat"
                  onClick={endChatWithDelay}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          }
        >
          {/* Desktop panel - hide its own header to avoid duplication with dock header */}
          <ChatPanel
            title="Printy Assistant"
            messages={messages}
            onSend={handleAdminSend}
            isTyping={isTyping}
            quickReplies={quickReplies}
            inputPlaceholder={inputPlaceholder}
            onQuickReply={handleAdminQuickReply}
            onEndChat={endChatWithDelay}
          />
        </ChatDock>
      </div>
    </AdminProvider>
  );
};

export default AdminShell;
