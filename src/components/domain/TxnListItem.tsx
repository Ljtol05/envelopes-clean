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
    preauth: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    captured: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
    settled: 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
  };

  const normalizeReason = (
    r: ReasonChipProps['reason'] | 'mcc'
  ): ReasonChipProps['reason'] => (r === 'mcc' ? 'mcc_match' : r);

  return isClickable ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-4 rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] bg-white transition-all duration-200',
        'cursor-pointer hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-neutral-300)] touch-target',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Left Side - Transaction Info */}
        <div className="flex-1 min-w-0">
          {/* Merchant & Amount */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-body font-medium text-[var(--color-neutral-900)] truncate pr-2">
              {merchant}
            </h4>
            <div className="text-right flex-shrink-0">
              <p className="text-body font-medium text-[var(--color-neutral-900)]">
                -{formatCurrency(amount)}
              </p>
              {tip && tip > 0 && (
                <p className="text-caption text-[var(--color-neutral-500)]">
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
            <span className="text-caption text-[var(--color-neutral-500)]">
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
              <Badge className="text-xs bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
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
        'p-4 rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] bg-white transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Left Side - Transaction Info */}
        <div className="flex-1 min-w-0">
          {/* Merchant & Amount */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-body font-medium text-[var(--color-neutral-900)] truncate pr-2">
              {merchant}
            </h4>
            <div className="text-right flex-shrink-0">
              <p className="text-body font-medium text-[var(--color-neutral-900)]">
                -{formatCurrency(amount)}
              </p>
              {tip && tip > 0 && (
                <p className="text-caption text-[var(--color-neutral-500)]">
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
            <span className="text-caption text-[var(--color-neutral-500)]">
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
              <Badge className="text-xs bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
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