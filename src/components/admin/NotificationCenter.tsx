import React, { useState } from 'react';
import { Text, Badge, Button } from '../shared';
import { Bell, X, Check, AlertTriangle, Info, Clock } from 'lucide-react';

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'ticket' | 'service' | 'system' | 'customer';
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface NotificationCenterProps {
  notifications: AdminNotification[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => 
    n.priority === 'high' || n.priority === 'urgent'
  ).length;

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'high-priority') return notification.priority === 'high' || notification.priority === 'urgent';
    return true;
  });

  const getTypeIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: AdminNotification['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getPriorityColor = (priority: AdminNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getCategoryColor = (category: AdminNotification['category']) => {
    switch (category) {
      case 'order':
        return 'primary';
      case 'ticket':
        return 'warning';
      case 'service':
        return 'success';
      case 'customer':
        return 'accent';
      case 'system':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 hover:text-neutral-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {(unreadCount > 0 || highPriorityCount > 0) && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="error" size="sm">
              {unreadCount > 0 ? unreadCount : highPriorityCount}
            </Badge>
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-neutral-200 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-primary" />
                <Text variant="h4" size="lg" weight="semibold">Notifications</Text>
                <Badge variant="primary" size="sm">{notifications.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mt-3">
              {(['all', 'unread', 'high-priority'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === filterType
                      ? 'bg-brand-primary text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filterType === 'all' && `All (${notifications.length})`}
                  {filterType === 'unread' && `Unread (${unreadCount})`}
                  {filterType === 'high-priority' && `High Priority (${highPriorityCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <Text variant="p" size="sm">No notifications</Text>
                <Text variant="p" size="xs" color="muted">
                  {filter === 'unread' ? 'All notifications are read' : 
                   filter === 'high-priority' ? 'No high priority notifications' : 
                   'You\'re all caught up!'}
                </Text>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    } hover:bg-neutral-50`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === 'success' ? 'bg-green-100 text-green-600' :
                          notification.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                          notification.type === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {getTypeIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text variant="p" size="sm" weight="medium" className="truncate">
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getTypeColor(notification.type)} size="sm">
                            {notification.type}
                          </Badge>
                          <Badge variant={getPriorityColor(notification.priority)} size="sm">
                            {notification.priority}
                          </Badge>
                          <Badge variant={getCategoryColor(notification.category)} size="sm">
                            {notification.category}
                          </Badge>
                        </div>
                        
                        <Text variant="p" size="xs" color="muted" className="mb-2">
                          {notification.message}
                        </Text>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(notification.timestamp)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {notification.action && (
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={notification.action.onClick}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => onMarkAsRead(notification.id)}
                                className="text-xs"
                              >
                                Mark read
                              </Button>
                            )}
                            {notification.dismissible && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => onDismiss(notification.id)}
                                className="text-neutral-400 hover:text-neutral-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between">
                <Text variant="p" size="xs" color="muted">
                  {unreadCount} unread, {highPriorityCount} high priority
                </Text>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onClearAll}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
