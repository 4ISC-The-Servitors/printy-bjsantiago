import React, { useState, useEffect } from 'react';
import { Text, Card, Pagination, ToastContainer } from '@shared/components';
import {
  MarkAllReadButton,
  DeleteAllNotificationsButton,
  Button,
  Modal,
} from '@shared/components/ui';
import { X } from 'lucide-react';
import { NotificationListSkeleton } from '@shared/components/feedback';
import { supabase } from '@lib/supabase';
import { useToast } from '@lib/useToast';
import { useBreakpoint } from '@shared/hooks/ui/useBreakpoint';
import { useResponsiveClasses } from '@shared/hooks/ui';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';
// import { useNotificationSound } from '@shared/hooks';
import {
  type UINotificationItem,
  startNotificationListener,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications, // ✅ new backend util
} from '@shared/utils/notificationUtils';

const AdminDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<UINotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, toast] = useToast();
  // const { playSound } = useNotificationSound({ enabled: true, volume: 0.3 });
  const { textClasses } = useResponsiveClasses();
  const breakpoint = useBreakpoint();

  // Responsive pagination
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize({
    itemHeight: 120,
    itemSpacing: 12,
    headerOffset: 200,
    footerOffset: 0,
    minItems: 3,
    maxItems: 15,
    useDynamicCalculation: true,
    breakpoints: {
      phone: 3,
      tablet: 6,
      desktop: 8,
    },
  });

  // Current user
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

    const loadNotifications = async () => {
      setIsLoading(true);
      const items = await fetchUserNotifications(user.id);
      setNotifications(items);
      setUnreadCount(items.filter(item => !item.isRead).length);
      setIsLoading(false);
    };

    loadNotifications();

    const cleanup = startNotificationListener(user.id, toast, item => {
      setNotifications(prev => [item, ...prev]);
      if (!item.isRead) setUnreadCount(prev => prev + 1);
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

  const handleDeleteAll = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (!user || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteAllNotifications(user.id); // ✅ now uses Supabase mutation
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setIsDeleteModalOpen(false);
      toast.success('Notifications cleared', 'All notifications deleted.');
    } catch (error: any) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteAll = () => {
    setIsDeleteModalOpen(false);
  };

  // Pagination logic
  const start = (page - 1) * pageSize;
  const paginatedNotifications = notifications.slice(start, start + pageSize);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(notifications.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [notifications.length, pageSize, page]);

  if (!user) return null;

  return (
    <div>
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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <MarkAllReadButton
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className={`${textClasses.caption}`}
              />
            )}
            {notifications.length > 0 && (
              <DeleteAllNotificationsButton
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                className={`${textClasses.caption}`}
              />
            )}
          </div>
        </div>

        {isLoading ? (
          <NotificationListSkeleton itemCount={pageSize} />
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Text variant="p" className="text-neutral-500">
              No notifications
            </Text>
          </Card>
        ) : (
          <>
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
                          weight="medium"
                          className={`${textClasses.caption} text-gray-900`}
                        >
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <Text
                        variant="p"
                        className={`${textClasses.caption} text-gray-600 mb-2`}
                      >
                        {notification.message}
                      </Text>
                      <div className="flex items-center gap-2">
                        <Text
                          className={`${textClasses.caption} text-gray-500`}
                        >
                          {notification.timestamp}
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

      {/* Delete All Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDeleteAll}
        size="sm"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="lg" weight="semibold">
              Delete all notifications?
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelDeleteAll}
              className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
              aria-label="Close delete notifications modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p" color="muted">
              This action deletes all your notifications. Are you sure you want
              to continue?
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button variant="ghost" size="sm" onClick={handleCancelDeleteAll}>
              Cancel
            </Button>
            <Button
              variant="error"
              size="sm"
              onClick={handleConfirmDeleteAll}
              loading={isDeleting}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Yes, delete all'}
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={breakpoint === 'mobile' ? 'top-center' : 'bottom-right'}
      />
    </div>
  );
};

export default AdminDashboard;
