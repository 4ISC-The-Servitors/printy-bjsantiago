import { supabase } from '../../lib/supabase';
import type { ToastMethods } from '../../lib/useToast';

type Cleanup = () => void;

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UINotificationItem {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

/**
 * Convert ISO timestamp to a human-readable label like "2 min ago"
 */
function timeAgoLabel(date: string): string {
  const parsed = new Date(date).getTime();
  if (Number.isNaN(parsed)) return 'just now';
  const diffMs = Date.now() - parsed;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Starts a real-time Supabase listener that pushes new notifications
 * to both the toast and UI.
 *
 * @param userId - Current user ID
 * @param toast - Toast controller (from useToast)
 * @param pushItem - Function to push the new notification to state/UI
 * @returns Cleanup function to unsubscribe
 */
export function startNotificationListener(
  userId: string,
  toast: ToastMethods,
  pushItem: (item: UINotificationItem) => void
): Cleanup {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const notif = payload.new as NotificationRecord;

        const item: UINotificationItem = {
          id: notif.id,
          message: notif.message,
          timestamp: timeAgoLabel(notif.created_at),
          isRead: notif.is_read,
        };

        // Show a toast popup
        toast.info(notif.title ?? 'Notification', notif.message);

        // Push to UI list
        pushItem(item);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch all existing notifications for a user
 * (sorted by most recent first)
 */
export async function fetchUserNotifications(userId: string): Promise<UINotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,message,is_read,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading notifications:', error.message);
    return [];
  }

  return (
    data?.map((n) => ({
      id: n.id,
      message: n.message,
      timestamp: timeAgoLabel(n.created_at),
      isRead: n.is_read,
    })) ?? []
  );
}

// Optional alias for callers that expect fetchNotifications
export { fetchUserNotifications as fetchNotifications };

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Failed to mark notification as read:', error.message);
  }
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to mark all as read:', error.message);
  }
}

/**
 * Delete a single notification by ID
 */
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete notification:', error.message);
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
  if (error) {
    console.error('Failed to delete all notifications:', error.message);
  }
}

