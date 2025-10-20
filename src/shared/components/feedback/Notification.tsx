import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useToast } from '@lib/useToast';
import { useResponsiveClasses, useDeviceUtils } from '@shared/hooks/ui';
import { Bell } from 'lucide-react';

type Cleanup = () => void;

export interface NotificationProps {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // info | success | warning | error
  category: string; // order | quote | ticket | chat | payment | system
  is_read: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  type: string;
  timestamp: string;
  isRead: boolean;
}

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

export interface UINotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  type: string;
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
  toast: any,
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

        // Show a toast popup with different levels
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
 * Fetch all existing notifications for a user
 * (sorted by most recent first)
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
export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('customer_id', userId);

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
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('customer_id', userId);
  if (error) {
    console.error('Failed to delete all notifications:', error.message);
  }
}

/**
 * Notification Bell Component
 * Displays notification count and handles real-time updates
 */
const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<UINotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [, toast] = useToast();
  const { textClasses, iconClasses } = useResponsiveClasses();
  const { isMobileOrTablet } = useDeviceUtils();

  // Get current user
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const loadNotifications = async () => {
      const items = await fetchUserNotifications(user.id);
      setNotifications(items);
      setUnreadCount(items.filter(item => !item.isRead).length);
    };

    loadNotifications();

    // Set up real-time listener
    const cleanup = startNotificationListener(user.id, toast, item => {
      setNotifications(prev => [item, ...prev]);
      if (!item.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return cleanup;
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <div
      className={`fixed ${isMobileOrTablet ? 'top-3 right-3' : 'top-4 right-4'} z-50`}
    >
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative ${isMobileOrTablet ? 'p-2' : 'p-3'} bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors`}
        >
          <Bell className={`${iconClasses.small} text-gray-600`} />
          {unreadCount > 0 && (
            <span
              className={`absolute ${isMobileOrTablet ? '-top-1 -right-1 h-4 w-4 text-xs' : '-top-1 -right-1 h-5 w-5 text-xs'} bg-red-500 text-white rounded-full flex items-center justify-center`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 top-full mt-2 ${isMobileOrTablet ? 'w-72' : 'w-80'} bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden`}
          >
            <div
              className={`${isMobileOrTablet ? 'p-3' : 'p-4'} border-b border-gray-200 flex justify-between items-center`}
            >
              <h3
                className={`${textClasses.heading} font-semibold text-gray-900`}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className={`${textClasses.caption} text-blue-600 hover:text-blue-800`}
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div
                  className={`${isMobileOrTablet ? 'p-3' : 'p-4'} text-center text-gray-500`}
                >
                  <p className={textClasses.body}>No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`${isMobileOrTablet ? 'p-3' : 'p-4'} border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4
                          className={`${textClasses.body} font-medium text-gray-900`}
                        >
                          {notification.title}
                        </h4>
                        <p
                          className={`${textClasses.caption} text-gray-600 mt-1`}
                        >
                          {notification.message}
                        </p>
                        <p
                          className={`${textClasses.caption} text-gray-400 mt-2`}
                        >
                          {notification.timestamp}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div
                          className={`${isMobileOrTablet ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-blue-500 rounded-full ml-2 mt-1`}
                        ></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
