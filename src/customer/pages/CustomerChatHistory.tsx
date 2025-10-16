import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import Header from '@customer/components/chatHistory/Header';
import Filters from '@customer/components/chatHistory/Filters';
import ConversationList from '@customer/components/chatHistory/ConversationList';
import { Text } from '@shared/components';
import type { ChatMessage } from '@components/chat/types';
import { getUserSessionsV2 } from '@features/api/jsonbChatFlowApi';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  status: 'active' | 'ended';
}

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Responsive layout helper
  const [, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleModern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const handleLegacy = function (
      this: MediaQueryList,
      e: MediaQueryListEvent
    ) {
      setIsDesktop(e.matches);
    };
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handleModern);
    else (mql as MediaQueryList).addListener(handleLegacy);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handleModern);
      else (mql as MediaQueryList).removeListener(handleLegacy);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter(c => {
      const matchesQuery = q
        ? c.title.toLowerCase().includes(q) ||
          (c.messages[c.messages.length - 1]?.text || '')
            .toLowerCase()
            .includes(q)
        : true;
      const matchesStatus = status
        ? c.status === (status as 'active' | 'ended')
        : true;
      return matchesQuery && matchesStatus;
    });
  }, [conversations, query, status]);

  const openConversation = (id: string) => {
    // Ask dashboard to open this session, then navigate there
    window.dispatchEvent(
      new CustomEvent('customer-open-session', { detail: { sessionId: id } })
    );
    navigate('/customer');
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    navigate('/auth/signin');
  };

  // Flow ID to title mapping
  const FLOW_TITLES: Record<string, string> = {
    'ask-quote': 'Request a Quote',
    'ask-assistance': 'Get Help',
    'customer-track-ticket': 'Track Support Ticket',
    'upload-payment': 'Upload Payment',
    'track-order': 'Track Order',
    'about': 'About B.J. Santiago',
  };

  // Load conversations from DB (using chat_sessions_v2)
  useEffect(() => {
    (async () => {
      try {
        const list = await getUserSessionsV2();
        const convs: Conversation[] = list.map(s => ({
          id: s.sessionId,
          title: FLOW_TITLES[s.flowId] || s.flowId || 'Chat',
          createdAt: s.createdAt,
          messages: [],
          status: (s.status === 'ended' ? 'ended' : 'active') as
            | 'active'
            | 'ended',
        }));
        setConversations(convs);
      } catch (e) {
        console.error('ChatHistory load sessions error', e);
      }
    })();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Sidebar placements using the same pattern as Dashboard */}
      <div className="hidden lg:flex w-64 bg-white border-r border-neutral-200 flex-col">
        <SidebarPanel
          conversations={conversations as any}
          activeId={null}
          onSwitchConversation={openConversation}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={
            <LogoutButton onClick={() => setShowLogoutModal(true)} />
          }
        />
      </div>
      <div className="lg:hidden fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 z-50">
        <SidebarPanel
          conversations={conversations as any}
          activeId={null}
          onSwitchConversation={openConversation}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={
            <LogoutButton onClick={() => setShowLogoutModal(true)} />
          }
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col pl-16 lg:pl-0">
        <div className="p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            <Header
              subtitle="View all your past conversations with Printy"
              onBack={() => navigate('/customer')}
            />
            <Filters
              query={query}
              onQueryChange={setQuery}
              status={status}
              onStatusChange={setStatus}
              onClear={() => {
                setQuery('');
                setStatus('');
              }}
            />

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Text variant="p" size="base" color="muted">
                  No conversations found.
                </Text>
              </div>
            ) : (
              <ConversationList
                conversations={filtered}
                onOpen={openConversation}
              />
            )}
          </div>
        </div>
      </main>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default ChatHistory;
