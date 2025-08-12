import React from 'react';
import { cn } from '../ui/utils';
import { Badge } from '../ui/badge';
import { MCCChip } from './MCCChip';
import { ReasonChip } from './ReasonChip';
import type { ReasonChipProps } from './ReasonChip';

interface TxnListItemProps {
  merchant: string;
  amount: number;
  envelope: string;
  status?: 'preauth' | 'captured' | 'settled';
  tip?: number;
  isPreauth?: boolean;
  reasons?: Array<ReasonChipProps['reason'] | 'mcc'>;
  mccCode?: string;
  date: Date;
  onClick?: () => void;
  className?: string;
}

const TxnListItem: React.FC<TxnListItemProps> = ({
  merchant,
  amount,
  envelope,
  status = 'captured',
  tip,
  isPreauth = false,
  reasons = [],
  mccCode,
  date,
  onClick,
  className
}) => {
  const isClickable = !!onClick;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  const statusColors = {
    preauth: 'bg-[color:var(--owl-warning)]/10 text-[color:var(--owl-warning)]',
    captured: 'bg-[color:var(--owl-accent)]/10 text-[color:var(--owl-accent)]',
    settled: 'bg-[color:var(--owl-success)]/10 text-[color:var(--owl-success)]'
  } as const;

  const normalizeReason = (
    r: ReasonChipProps['reason'] | 'mcc'
  ): ReasonChipProps['reason'] => (r === 'mcc' ? 'mcc_match' : r);

  return isClickable ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-4 rounded-[var(--radius-sm)] border border-[color:var(--owl-border)] bg-[color:var(--owl-surface-alt)] transition-all duration-200',
        'cursor-pointer hover:bg-[color:var(--owl-surface)] hover:border-[color:var(--owl-border)] touch-target',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Left Side - Transaction Info */}
        <div className="flex-1 min-w-0">
          {/* Merchant & Amount */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-body font-medium text-[color:var(--owl-text-primary)] truncate pr-2">
              {merchant}
            </h4>
            <div className="text-right flex-shrink-0">
              <p className="text-body font-medium text-[color:var(--owl-text-primary)]">
                -{formatCurrency(amount)}
              </p>
              {tip && tip > 0 && (
                <p className="text-caption text-[color:var(--owl-text-secondary)]">
                  tip {formatCurrency(tip)}
                </p>
              )}
            </div>
          </div>

          {/* Envelope & Time */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {envelope}
            </Badge>
            <span className="text-caption text-[color:var(--owl-text-secondary)]">
              {formatDate(date)} • {formatTime(date)}
            </span>
          </div>

          {/* Status & MCC */}
          <div className="flex items-center gap-2 mb-2">
            {status !== 'settled' && (
              <Badge className={cn('text-xs', statusColors[status])}>
                {status === 'preauth' ? 'Pre-auth' : 'Captured'}
              </Badge>
            )}

            {isPreauth && (
              <Badge className="text-xs bg-[color:var(--owl-warning)]/10 text-[color:var(--owl-warning)]">
                Hold $175 → Settled
              </Badge>
            )}

            {mccCode && <MCCChip mccCode={mccCode} />}
          </div>

          {/* Decision Reasons */}
          {reasons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reasons.map((reason, index) => (
                <ReasonChip key={index} reason={normalizeReason(reason)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  ) : (
    <div
      className={cn(
        'p-4 rounded-[var(--radius-sm)] border border-[color:var(--owl-border)] bg-[color:var(--owl-surface-alt)] transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Left Side - Transaction Info */}
        <div className="flex-1 min-w-0">
          {/* Merchant & Amount */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-body font-medium text-[color:var(--owl-text-primary)] truncate pr-2">
              {merchant}
            </h4>
            <div className="text-right flex-shrink-0">
              <p className="text-body font-medium text-[color:var(--owl-text-primary)]">
                -{formatCurrency(amount)}
              </p>
              {tip && tip > 0 && (
                <p className="text-caption text-[color:var(--owl-text-secondary)]">
                  tip {formatCurrency(tip)}
                </p>
              )}
            </div>
          </div>

          {/* Envelope & Time */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {envelope}
            </Badge>
            <span className="text-caption text-[color:var(--owl-text-secondary)]">
              {formatDate(date)} • {formatTime(date)}
            </span>
          </div>

          {/* Status & MCC */}
          <div className="flex items-center gap-2 mb-2">
            {status !== 'settled' && (
              <Badge className={cn('text-xs', statusColors[status])}>
                {status === 'preauth' ? 'Pre-auth' : 'Captured'}
              </Badge>
            )}

            {isPreauth && (
              <Badge className="text-xs bg-[color:var(--owl-warning)]/10 text-[color:var(--owl-warning)]">
                Hold $175 → Settled
              </Badge>
            )}

            {mccCode && <MCCChip mccCode={mccCode} />}
          </div>

          {/* Decision Reasons */}
          {reasons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reasons.map((reason, index) => (
                <ReasonChip key={index} reason={normalizeReason(reason)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { TxnListItem };
export type { TxnListItemProps };