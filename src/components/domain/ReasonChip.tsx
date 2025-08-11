import React from 'react';
import { cn } from '../ui/utils';

interface ReasonChipProps {
  reason: 'mcc_match' | 'geofence' | 'user_active' | 'rule_match' | 'fallback_general_pool' | 'fallback_buffer';
  className?: string;
  'data-reason'?: string;
}

const ReasonChip: React.FC<ReasonChipProps> = ({
  reason,
  className,
  ...dataAttributes
}) => {
  const reasonConfigs = {
    mcc_match: {
      label: 'MCC Match',
      color: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20'
    },
    geofence: {
      label: 'Location',
      color: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20'
    },
    user_active: {
      label: 'Active Choice',
      color: 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/20'
    },
    rule_match: {
      label: 'Rule Applied',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    fallback_general_pool: {
      label: 'General Pool',
      color: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20'
    },
    fallback_buffer: {
      label: 'Buffer Used',
      color: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20'
    }
  };

  const config = reasonConfigs[reason];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-[var(--radius-lg)]',
        'border text-xs font-medium',
        config.color,
        className
      )}
      {...dataAttributes}
    >
      {config.label}
    </span>
  );
};

export { ReasonChip };
export type { ReasonChipProps };

/*
DEV PROPS:
- reason: 'mcc_match' | 'geofence' | 'user_active' | 'rule_match' | 'fallback_general_pool' | 'fallback_buffer'
- data-reason: string (for analytics)

DECISION CHAIN:
1. user_active (user manually selected envelope)
2. rule_match (custom routing rule applied)
3. mcc_match (merchant category match)  
4. geofence (location-based routing)
5. fallback_general_pool (if enabled)
6. fallback_buffer (last resort)
7. DECLINE (if no buffer available)
*/