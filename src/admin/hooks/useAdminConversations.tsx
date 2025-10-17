import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

export type AdminChatRole = 'user' | 'printy';

export interface AdminChatMessage {
  id: string;
  role: AdminChatRole;
  text: string;
  ts: number;
}

export interface AdminConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AdminChatMessage[];
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

interface AdminConversationsContextValue {
  conversations: AdminConversation[];
  activeId: string | null;
  startConversation: (title: string) => string; // returns id
  addMessage: (role: AdminChatRole, text: string, id?: string) => void;
  endConversation: (id?: string) => void;
  setActive: (id: string | null) => void;
  clear: () => void;
}

const AdminConversationsContext = createContext<
  AdminConversationsContextValue | undefined
>(undefined);

export const AdminConversationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const idCounter = useRef(0);

  const startConversation = (title: string) => {
    const id = `admin-conv-${Date.now()}-${++idCounter.current}`;
    const conv: AdminConversation = {
      id,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      status: 'active',
    };
    setConversations(prev => [conv, ...prev]);
    setActiveId(id);
    return id;
  };

  const addMessage = (role: AdminChatRole, text: string, id?: string) => {
    const targetId = id || activeId;
    if (!targetId) return;
    const msg: AdminChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      text,
      ts: Date.now(),
    };
    setConversations(prev =>
      prev.map(c =>
        c.id === targetId
          ? { ...c, updatedAt: msg.ts, messages: [...c.messages, msg] }
          : c
      )
    );
  };

  const endConversation = (id?: string) => {
    const targetId = id || activeId;
    if (!targetId) return;
    setConversations(prev =>
      prev.map(c => (c.id === targetId ? { ...c, status: 'ended' } : c))
    );
  };

  const clear = () => setConversations([]);

  const value = useMemo<AdminConversationsContextValue>(
    () => ({
      conversations,
      activeId,
      startConversation,
      addMessage,
      endConversation,
      setActive: setActiveId,
      clear,
    }),
    [conversations, activeId]
  );

  return (
    <AdminConversationsContext.Provider value={value}>
      {children}
    </AdminConversationsContext.Provider>
  );
};

export const useAdminConversations = () => {
  const ctx = useContext(AdminConversationsContext);
  if (!ctx)
    throw new Error(
      'useAdminConversations must be used within AdminConversationsProvider'
    );
  return ctx;
};
