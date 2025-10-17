import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useDeviceUtils } from '@shared/hooks/ui/useResponsiveClasses';

export interface NotificationProps {
  className?: string;
}

interface NotificationItem {
  id: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

const Notification: React.FC<NotificationProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Responsive hooks
  const { isMobile } = useDeviceUtils();

  // Mock notification data
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      message: 'You have a new ticket request',
      isRead: false,
      timestamp: '2 min ago'
    },
    {
      id: '2',
      message: 'You have a new ticket update',
      isRead: false,
      timestamp: '5 min ago'
    },
    {
      id: '3',
      message: 'You have an urgent order',
      isRead: false,
      timestamp: '10 min ago'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleCloseNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleCloseAll = () => {
    setNotifications([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`${className ?? ''} fixed top-4 right-4 z-50`}>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative flex items-center justify-center rounded-full bg-white border border-neutral-200 shadow-lg hover:shadow-xl transition-all duration-200 ${
            isMobile 
              ? 'w-8 h-8' 
              : 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11'
          }`}
          aria-label="Notifications"
        >
          <Bell className={`text-neutral-700 ${
            isMobile 
              ? 'w-4 h-4' 
              : 'w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6'
          }`} />
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-medium ${
              isMobile
                ? 'w-4 h-4 text-xs'
                : 'w-4 h-4 sm:w-5 sm:h-5 sm:text-xs md:w-5 md:h-5 md:text-sm lg:w-6 lg:h-6 lg:text-sm'
            }`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown Panel */}
        {isExpanded && (
          <div 
            ref={dropdownRef}
            className={`absolute top-full right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isMobile 
                ? 'w-64 p-2 space-y-2' 
                : 'w-72 sm:w-80 md:w-96 lg:w-[28rem] p-2 sm:p-3 md:p-4 lg:p-5 space-y-2 sm:space-y-3 md:space-y-4'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-neutral-200">
              <h3 className={`font-semibold text-neutral-900 ${
                isMobile 
                  ? 'text-xs' 
                  : 'text-xs sm:text-sm md:text-base lg:text-lg'
              }`}>
                Notifications
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-0.5 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Close notifications"
              >
                <X className={`text-neutral-500 hover:text-neutral-700 ${
                  isMobile 
                    ? 'w-3 h-3' 
                    : 'w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5'
                }`} />
              </button>
            </div>

            {/* Notifications List */}
            {notifications.length > 0 ? (
              <div className="space-y-1 sm:space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg border transition-colors ${
                      notification.isRead 
                        ? 'bg-neutral-50 border-neutral-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    {/* Bullet point */}
                    <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1 sm:mt-1.5 ${
                      notification.isRead ? 'bg-neutral-400' : 'bg-blue-500'
                    }`} />
                    
                    {/* Notification content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-neutral-900 font-medium ${
                        isMobile 
                          ? 'text-xs' 
                          : 'text-xs sm:text-xs md:text-sm lg:text-base'
                      }`}>
                        {notification.message}
                      </p>
                      <p className={`text-neutral-500 ${
                        isMobile 
                          ? 'text-xs' 
                          : 'text-xs sm:text-xs md:text-xs lg:text-sm'
                      }`}>
                        {notification.timestamp}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-0.5 hover:bg-neutral-100 rounded-full transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check className={`text-green-600 ${
                            isMobile 
                              ? 'w-2.5 h-2.5' 
                              : 'w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4'
                          }`} />
                        </button>
                      )}
                      <button
                        onClick={() => handleCloseNotification(notification.id)}
                        className="p-0.5 hover:bg-neutral-100 rounded-full transition-colors"
                        aria-label="Close notification"
                      >
                        <X className={`text-neutral-500 hover:text-neutral-700 ${
                          isMobile 
                            ? 'w-2.5 h-2.5' 
                            : 'w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4'
                        }`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-2 sm:py-3 md:py-4 text-neutral-500 ${
                isMobile 
                  ? 'text-xs' 
                  : 'text-xs sm:text-xs md:text-sm lg:text-base'
              }`}>
                No notifications
              </div>
            )}

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-neutral-200">
                <button
                  onClick={handleMarkAllAsRead}
                  className={`text-green-600 hover:text-green-700 font-medium transition-colors ${
                    isMobile 
                      ? 'text-xs' 
                      : 'text-xs sm:text-xs md:text-sm lg:text-sm'
                  }`}
                >
                  Mark all as read
                </button>
                <button
                  onClick={handleCloseAll}
                  className={`text-red-600 hover:text-red-700 font-medium transition-colors ${
                    isMobile 
                      ? 'text-xs' 
                      : 'text-xs sm:text-xs md:text-sm lg:text-sm'
                  }`}
                >
                  Delete all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
