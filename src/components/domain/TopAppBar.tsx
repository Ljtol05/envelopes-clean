import React from 'react';
import { cn } from '../ui/utils';
import { Bell, ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { Button } from '../ui/button';
import OwllocateLogo from '../common/OwllocateLogo';

interface TopAppBarProps {
  // title: string; // Removed unused prop
  subtitle?: string;
  totalBalance?: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
  className?: string;
}

const TopAppBar: React.FC<TopAppBarProps> = ({
  // title, // Removed unused prop
  subtitle,
  totalBalance,
  showBackButton = false,
  onBackPress,
  onNotificationPress,
  notificationCount = 0,
  className
}) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);

  return (
    <header
      className={cn(
  'flex items-center justify-between px-4 py-4 bg-[color:var(--owl-surface)] border-b border-[color:var(--owl-border)]',
        'safe-area-inset-top',
        className
      )}
    >
      {/* Left: Back button or logo, and subtitle */}
      <div className="flex items-center gap-2 min-w-0">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackPress}
            className="p-2 h-auto"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <OwllocateLogo width={70} height={70} title="Owllocate" />
        )}
        {subtitle && (
          <div className="min-w-0 flex-1">
            <p className="text-caption text-[color:var(--owl-text-secondary)] truncate">
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Center: Balance summary */}
      {totalBalance !== undefined && (
        <div className="text-center px-3">
          <p className="text-caption text-[color:var(--owl-text-secondary)]">
            Total Available
          </p>
          <p className="text-body font-medium text-[color:var(--owl-text-primary)]">
            {formatCurrency(totalBalance)}
          </p>
        </div>
      )}

      {/* Right: Notifications */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNotificationPress}
          className="relative p-2 h-auto"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-[color:var(--owl-error,var(--owl-accent))] text-[color:var(--owl-on-strong)] text-xs rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
};

export { TopAppBar };
export type { TopAppBarProps };