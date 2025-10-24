import React, { useState, useEffect } from 'react';
import { Text, Card, Pagination } from '@shared/components';
import { supabase } from '@lib/supabase';
import { useToast } from '@lib/useToast';
import { useResponsiveClasses } from '@shared/hooks/ui';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';
import {
  type UINotificationItem,
  startNotificationListener,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@shared/utils/notificationUtils';

const AdminDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<UINotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, toast] = useToast();
  const { textClasses } = useResponsiveClasses();

  // Responsive pagination state
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize({
    itemHeight: 120, // Approximate height of notification card
    itemSpacing: 12, // space-y-3 = 12px
    headerOffset: 200, // Navbar + header + pagination
    footerOffset: 0, // No footer pagination
    minItems: 3,
    maxItems: 15,
    useDynamicCalculation: true,
    breakpoints: {
      phone: 3,
      tablet: 6,
      desktop: 8,
    },
  });

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
      setIsLoading(true);
      const items = await fetchUserNotifications(user.id);
      setNotifications(items);
      setUnreadCount(items.filter(item => !item.isRead).length);
      setIsLoading(false);
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

  // Calculate paginated notifications
  const start = (page - 1) * pageSize;
  const paginatedNotifications = notifications.slice(start, start + pageSize);

  // Reset to page 1 if current page exceeds available pages
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(notifications.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [notifications.length, pageSize, page]);

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <Text
          variant="h1"
          size="3xl"
          weight="bold"
          className="text-neutral-900"
        >
          Admin Dashboard
        </Text>
        <Text variant="p" size="base" color="muted" className="mt-1">
          Latest notifications and updates
        </Text>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Text
            variant="h2"
            size="xl"
            weight="semibold"
            className="text-neutral-900"
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className={`${textClasses.caption} text-blue-600 hover:text-blue-800 font-medium`}
            >
              Mark all as read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Text variant="p" color="muted">
              Loading notifications...
            </Text>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Text variant="p" color="muted">
              No notifications
            </Text>
          </div>
        ) : (
          <>
            {/* Pagination Header */}
            {notifications.length > pageSize && (
              <div className="flex items-center justify-center px-1 py-1 mb-4">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={notifications.length}
                  onPageChange={setPage}
                />
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-3">
              {paginatedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Text
                          variant="p"
                          size="base"
                          weight="medium"
                          className="text-gray-900"
                        >
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <Text
                        variant="p"
                        size="sm"
                        color="muted"
                        className="mb-2"
                      >
                        {notification.message}
                      </Text>
                      <div className="flex items-center gap-2">
                        <Text variant="p" size="xs" color="muted">
                          {notification.timestamp}
                        </Text>
                        <span className="text-xs text-gray-400">•</span>
                        <Text variant="p" size="xs" color="muted">
                          {notification.category}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
