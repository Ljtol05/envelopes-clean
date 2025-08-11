import React from 'react';
import { cn } from '../ui/utils';

interface MCCChipProps {
  mccCode: string;
  className?: string;
  'data-mcc'?: string;
}

const MCCChip: React.FC<MCCChipProps> = ({
  mccCode,
  className,
  ...dataAttributes
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-lg)]',
        'bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20',
        'text-xs font-medium',
        className
      )}
      {...dataAttributes}
    >
      <span className="text-mono">mcc:{mccCode}</span>
    </span>
  );
};

export { MCCChip };
export type { MCCChipProps };

/*
DEV PROPS:
- mccCode: string (4-digit merchant category code)
- data-mcc: string (for filtering/analytics)

COMMON MCC CODES:
- 5411: Grocery Stores
- 5814: Fast Food Restaurants  
- 5542: Automated Fuel Dispensers
- 5311: Department Stores
*/