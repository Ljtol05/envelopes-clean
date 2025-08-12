import React from 'react';
import { cn } from '../ui/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { CheckCircle, AlertTriangle, Info, X, Check, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    endpoint: string;
  data?: Record<string, unknown>;
  };
}

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationAction?: (notification: Notification) => void;
  className?: string;
  'data-endpoint'?: string;
}

const NotificationSheet: React.FC<NotificationSheetProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationAction,
  className,
  ...dataAttributes
}) => {
  // Sample notification data
  const sampleNotifications: Notification[] = notifications || [
    {
      id: 'notif_1',
      type: 'success',
      title: 'Transaction Approved',
      message: '$45.67 at KROGER #842 routed to Groceries envelope',
      timestamp: '2025-01-08T14:30:00Z',
      read: false,
      action: {
        label: 'View Details',
        endpoint: 'GET /transactions/txn_abc123'
      }
    },
    {
      id: 'notif_2', 
      type: 'warning',
      title: 'Low Balance Alert',
      message: 'Dining envelope has $12.50 remaining',
      timestamp: '2025-01-08T12:15:00Z',
      read: false,
      action: {
        label: 'Add Funds',
        endpoint: 'POST /envelopes/transfer'
      }
    },
    {
      id: 'notif_3',
      type: 'info',
      title: 'Rule Applied',
      message: 'New rule created for STARBUCKS → Dining',
      timestamp: '2025-01-08T10:45:00Z',
      read: true,
      action: {
        label: 'View Rules',
        endpoint: 'GET /rules'
      }
    },
    {
      id: 'notif_4',
      type: 'error',
      title: 'Transaction Declined',
      message: 'Insufficient funds in Gas envelope for $89.45',
      timestamp: '2025-01-07T18:20:00Z',
      read: true,
      action: {
        label: 'Add Funds',
        endpoint: 'POST /envelopes/transfer'
      }
    }
  ];

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'error': return X;
      default: return Info;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-[color:var(--owl-success)]';
      case 'warning': return 'text-[color:var(--owl-warning)]';
      case 'info': return 'text-[color:var(--owl-accent)]';
      case 'error': return 'text-[color:var(--owl-error)]';
      default: return 'text-[color:var(--owl-text-secondary)]';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const unreadCount = sampleNotifications.filter(n => !n.read).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className={cn('w-full sm:max-w-md p-0', className)}
        {...dataAttributes}
      >
  <SheetHeader className="p-4 border-b border-[color:var(--owl-border)]">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-h1">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-[color:var(--owl-accent)] text-caption"
                data-action="mark_all_read"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription className="text-caption text-[color:var(--owl-text-secondary)]">
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All notifications'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {sampleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="p-3 bg-[color:var(--owl-surface)] rounded-full mb-4">
                <Bell className="h-6 w-6 text-[color:var(--owl-text-secondary)]/70" />
              </div>
              <h3 className="text-body font-medium text-[color:var(--owl-text-primary)] mb-2">
                No notifications
              </h3>
              <p className="text-caption text-[color:var(--owl-text-secondary)] text-center">
                You're all caught up! Notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--owl-border)]">
              {sampleNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-[color:var(--owl-surface)] transition-colors duration-200',
                      !notification.read && 'bg-[color:var(--owl-accent)]/5 border-l-2 border-l-[color:var(--owl-accent)]'
                    )}
                    data-notification-id={notification.id}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn('p-1 rounded-full flex-shrink-0 mt-0.5', colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-body font-medium text-[color:var(--owl-text-primary)] truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))] rounded-full flex-shrink-0" />
                              )}
                            </div>
                              <p className="text-caption text-[color:var(--owl-text-secondary)] leading-relaxed">
                              {notification.message}
                            </p>
                          </div>

                          {/* Mark as read button */}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMarkAsRead?.(notification.id)}
                                className="p-1 h-auto text-[color:var(--owl-text-secondary)]/70 hover:text-[color:var(--owl-text-secondary)] flex-shrink-0"
                              data-action="mark_read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Timestamp and Action */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[color:var(--owl-text-secondary)]">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          {notification.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onNotificationAction?.(notification)}
                                className="text-[color:var(--owl-accent)] text-xs h-auto py-1 px-2"
                              data-action="notification:action"
                              data-endpoint={notification.action.endpoint}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { NotificationSheet };
export type { NotificationSheetProps, Notification };

/*
DEV PROPS:
- notifications: Array<Notification>
- onMarkAsRead: (id: string) => void
- onMarkAllAsRead: () => void
- onNotificationAction: (notification) => void
- data-endpoint: "GET /notifications"

NOTIFICATION TYPES:
- success: transaction approved, rule created
- warning: low balance, spending threshold
- info: system updates, tips
- error: declined transactions, failures

ACTIONS:
- View Details → navigate to transaction/rule
- Add Funds → open TransferModal
- Mark read → update notification state
*/