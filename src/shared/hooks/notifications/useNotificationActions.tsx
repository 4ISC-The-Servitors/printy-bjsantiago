import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface MinimalNotificationItem {
  id: string;
  isRead?: boolean;
}

export function useNotificationActions<T extends MinimalNotificationItem>() {
  const markAllAsRead = useCallback(
    async (
      _list: T[],
      setList: Dispatch<SetStateAction<T[]>>
    ): Promise<void> => {
      setList(prev => prev.map(item => ({ ...item, isRead: true })) as T[]);
    },
    []
  );

  const deleteAll = useCallback(
    async (
      _list: T[],
      setList: Dispatch<SetStateAction<T[]>>
    ): Promise<void> => {
      setList(() => []);
    },
    []
  );

  return { markAllAsRead, deleteAll } as const;
}

export default useNotificationActions;
