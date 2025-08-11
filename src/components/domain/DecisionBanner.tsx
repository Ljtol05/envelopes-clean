import React from 'react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface DecisionBannerProps {
  variant: 'success' | 'info' | 'warning' | 'error';
  message: string;
  envelope?: string;
  onUndo?: () => void;
  onDismiss?: () => void;
  className?: string;
  'data-transaction-id'?: string;
  'data-endpoint'?: string;
  'data-action'?: string;
}

const DecisionBanner: React.FC<DecisionBannerProps> = ({
  variant,
  message,
  envelope,
  onUndo,
  onDismiss,
  className,
  ...dataAttributes
}) => {
  const variants = {
    success: {
      container: 'bg-[var(--color-success)]/10 border-[var(--color-success)]/20 text-[var(--color-success)]',
      icon: CheckCircle,
      text: 'text-[var(--color-success)]'
    },
    info: {
      container: 'bg-[var(--color-info)]/10 border-[var(--color-info)]/20 text-[var(--color-info)]',
      icon: Info,
      text: 'text-[var(--color-info)]'
    },
    warning: {
      container: 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20 text-[var(--color-warning)]',
      icon: AlertTriangle,
      text: 'text-[var(--color-warning)]'
    },
    error: {
      container: 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20 text-[var(--color-danger)]',
      icon: XCircle,
      text: 'text-[var(--color-danger)]'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-[var(--radius-md)] border',
        'animate-in slide-in-from-top-2 duration-300',
        config.container,
        className
      )}
      {...dataAttributes}
    >
      {/* Left Side - Message */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={cn('h-5 w-5 flex-shrink-0', config.text)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-body font-medium leading-tight', config.text)}>
            {message}
            {envelope && (
              <span className="font-semibold"> {envelope}</span>
            )}
          </p>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onUndo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            className={cn(
              'text-caption px-3 py-1 h-auto touch-target',
              'hover:bg-white/20',
              config.text
            )}
            data-action="undo:transaction"
          >
            Undo
          </Button>
        )}
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="p-1 h-auto touch-target hover:bg-white/20"
          >
            <X className={cn('h-4 w-4', config.text)} />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export { DecisionBanner };
export type { DecisionBannerProps };

/*
DEV PROPS:
- variant: 'success' | 'info' | 'warning' | 'error'
- message: string (e.g., "Used" or "Failed to route to")
- envelope: string (envelope name that was used)
- onUndo: () => void (available for 60min after transaction)
- onDismiss: () => void
- data-transaction-id: string
- data-endpoint: "POST /transactions/undo"
- data-action: "undo:transaction"

USAGE EXAMPLES:
- Success: "Used Groceries envelope"
- Warning: "Not enough in Groceries. Used Buffer."
- Error: "Declined: envelope limit exceeded"
*/