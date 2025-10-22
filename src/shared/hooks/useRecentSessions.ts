import { useState, useEffect } from 'react';

interface RecentSession {
  conversationId: string;
  sessionId: string;
  customerName?: string;
  title?: string;
  lastMessage?: string;
  timestamp: string;
  isMinimized?: boolean;
  userType?: 'customer' | 'admin';
}

export const useRecentSessions = () => {
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentChatSessions');
    if (stored) {
      try {
        setRecentSessions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent sessions:', error);
        localStorage.removeItem('recentChatSessions');
      }
    }
  }, []);

  const addToRecentSessions = (session: RecentSession) => {
    setRecentSessions(prev => {
      const filtered = prev.filter(s => s.conversationId !== session.conversationId);
      const updated = [session, ...filtered].slice(0, 10);

      try {
        localStorage.setItem('recentChatSessions', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent sessions:', error);
      }

      return updated;
    });
  };

  const removeFromRecentSessions = (conversationId: string) => {
    setRecentSessions(prev => {
      const filtered = prev.filter(s => s.conversationId !== conversationId);

      try {
        localStorage.setItem('recentChatSessions', JSON.stringify(filtered));
      } catch (error) {
        console.error('Failed to save recent sessions:', error);
      }

      return filtered;
    });
  };

  const clearRecentSessions = () => {
    setRecentSessions([]);
    try {
      localStorage.removeItem('recentChatSessions');
    } catch (error) {
      console.error('Failed to clear recent sessions:', error);
    }
  };

  const getSessionByConversationId = (conversationId: string): RecentSession | undefined => {
    return recentSessions.find(s => s.conversationId === conversationId);
  };

  const getSessionsByUserType = (userType: 'customer' | 'admin'): RecentSession[] => {
    return recentSessions.filter(s => s.userType === userType);
  };

  return {
    recentSessions,
    addToRecentSessions,
    removeFromRecentSessions,
    clearRecentSessions,
    getSessionByConversationId,
    getSessionsByUserType,
  };
}