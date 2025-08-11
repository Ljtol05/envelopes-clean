import React from 'react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
  className?: string;
  'data-action'?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  onClick,
  className,
  ...dataAttributes
}) => {
  const hasNotifications = count > 0;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'relative p-2 h-auto touch-target',
        'hover:bg-[var(--color-neutral-100)] transition-colors duration-200',
        className
      )}
      {...dataAttributes}
    >
      <Bell className={cn(
        'h-5 w-5',
        hasNotifications ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-neutral-600)]'
      )} />
      
      {hasNotifications && (
        <Badge 
          className={cn(
            'absolute -top-1 -right-1 h-5 min-w-[20px] px-1',
            'bg-[var(--color-danger)] text-white text-xs font-medium',
            'flex items-center justify-center rounded-full',
            count > 99 ? 'px-1.5' : ''
          )}
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
      
      <span className="sr-only">
        {hasNotifications 
          ? `${count} unread notification${count !== 1 ? 's' : ''}` 
          : 'No notifications'
        }
      </span>
    </Button>
  );
};

export { NotificationBell };
export type { NotificationBellProps };

/*
DEV PROPS:
- count: number (unread notification count)
- onClick: () => void (opens NotificationSheet)
- data-action: "open:NotificationSheet"

BADGE STATES:
- No badge: count = 0
- Number: count 1-99
- "99+": count > 99
- Red background for urgency
*/