import { supabase } from '@lib/supabase';

export type Cleanup = () => void;

// Database record as stored in Supabase
export interface NotificationRecord {
  id: string;
  customer_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

// UI-facing notification type (used by components)
export interface UINotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  type: string;
  timestamp: string;
  isRead: boolean;
}

// Alias to keep backward compatibility with any existing imports
export type NotificationItem = UINotificationItem;

/**
 * Convert ISO timestamp to a human-readable label like "2 min ago"
 */
export function timeAgoLabel(date: string): string {
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
 * @param playSound - Optional function to play notification sound
 * @returns Cleanup function to unsubscribe
 */

export function startNotificationListener(
  userId: string,
  toast: any,
  pushItem: (item: UINotificationItem) => void,
  // playSound?: () => void,
  // suppressFirstSoundMs: number = 4000
): Cleanup {
  // const subscribedAt = Date.now();

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `customer_id=eq.${userId}`,
      },
      payload => {
        const notif = payload.new as NotificationRecord;

        const item: UINotificationItem = {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          category: notif.category,
          type: notif.type,
          timestamp: timeAgoLabel(notif.created_at),
          isRead: notif.is_read,
        };

        // Play sound notification (skip during initial cooldown)
        // Commented out sound notifications for now
        // Optional sound behavior (commented out for now)
        // if (Date.now() - subscribedAt >= suppressFirstSoundMs) {
        //   playSound?.();
        // }

        // Display toast
        switch (notif.type) {
          case 'success':
            toast.success(notif.title ?? 'Success', notif.message);
            break;
          case 'error':
            toast.error(notif.title ?? 'Error', notif.message);
            break;
          case 'warning':
            toast.warning(notif.title ?? 'Warning', notif.message);
            break;
          default:
            toast.info(notif.title ?? 'Notification', notif.message);
        }

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
 * Fetch all existing notifications for a user (sorted by most recent first)
 */
export async function fetchUserNotifications(
  userId: string
): Promise<UINotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,message,type,category,is_read,created_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading notifications:', error.message);
    return [];
  }

  return (
    data?.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category,
      type: n.type,
      timestamp: timeAgoLabel(n.created_at),
      isRead: n.is_read,
    })) ?? []
  );
}

/**
 * Mark a single notification as read
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
    .eq('customer_id', userId);

  if (error) {
    console.error('Failed to mark all notifications as read:', error.message);
  }
}

/**
 * Delete a single notification by ID
 */
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete notification:', error.message);
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('customer_id', userId);

  if (error) {
    console.error('Failed to delete all notifications:', error.message);
    throw error; // propagate for toast handling in component
  }
}
