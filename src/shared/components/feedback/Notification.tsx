import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useToast } from '@lib/useToast';
import { ToastContainer } from '@shared/components';
import { useResponsiveClasses, useDeviceUtils } from '@shared/hooks/ui';
import { useNotificationVisibility } from '@shared/hooks/ui/useNotificationVisibility';
import { useNotificationSound } from '@shared/hooks';
import { Bell } from 'lucide-react';
import { Button, Modal } from '@shared/components/ui';
import { X } from 'lucide-react';
import {
  MarkAllReadButton,
  DeleteAllNotificationsButton,
} from '@shared/components/ui';
import {
  type UINotificationItem,
  startNotificationListener,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../utils/notificationUtils';

/**
 * Notification Bell Component
 * Displays notification count and handles real-time updates
 */
const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<UINotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, toast] = useToast();
  const { textClasses, iconClasses } = useResponsiveClasses();
  const { isMobileOrTablet } = useDeviceUtils();
  const { isVisible } = useNotificationVisibility();
  const { playSound } = useNotificationSound({ enabled: true, volume: 0.3 });

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
    const cleanup = startNotificationListener(
      user.id,
      toast,
      item => {
        setNotifications(prev => [item, ...prev]);
        if (!item.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      },
      playSound
    );

    return cleanup;
  }, [user, playSound]);

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
    setIsOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setNotifications([]);
      setUnreadCount(0);
      setIsDeleteModalOpen(false);
      setIsOpen(false);
      toast.success('Notifications cleared', 'All notifications deleted.');
    } catch (error) {
      toast.error('Delete failed', String(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteAll = () => {
    setIsDeleteModalOpen(false);
  };

  if (!user || !isVisible) return null;

  return (
    <div
      className="fixed top-0 right-0"
      style={{
        position: 'fixed',
        top: isMobileOrTablet ? '12px' : '16px',
        right: isMobileOrTablet ? '12px' : '16px',
        zIndex: 999,
      }}
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
            className={`absolute ${isMobileOrTablet ? 'right-0' : 'right-0 -translate-x-4'} top-full mt-2 ${
              isMobileOrTablet
                ? 'w-[90vw] max-w-[560px]'
                : 'w-[560px]'
            } bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden`}
          >
            <div
              className={`${isMobileOrTablet ? 'p-3' : 'p-4'} border-b border-gray-200 flex justify-between items-center`}
            >
              <h3
                className={`${textClasses.heading} font-semibold text-gray-900`}
              >
                Notifications
              </h3>
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
      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDeleteAll} size="sm">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className={`${textClasses.heading} font-semibold text-gray-900`}>
              Delete all notifications?
            </h3>
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
            <p className={`${textClasses.body} text-gray-600`}>
              This action deletes all your notifications. Are you sure you want to continue?
            </p>
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
        position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
      />
    </div>
  );
};

export default Notification;
