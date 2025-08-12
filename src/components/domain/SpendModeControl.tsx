import React from 'react';
import { cn } from '../ui/utils';
import { Target, Zap, ShoppingBag } from 'lucide-react';

interface SpendModeControlProps {
  value: 'LOCKED' | 'SMART_AUTO' | 'GENERAL_POOL';
  onChange: (value: 'LOCKED' | 'SMART_AUTO' | 'GENERAL_POOL') => void;
  className?: string;
  'data-endpoint'?: string;
  'data-action'?: string;
}

const SpendModeControl: React.FC<SpendModeControlProps> = ({
  value,
  onChange,
  className,
  ...dataAttributes
}) => {
  const modes = [
    {
      value: 'LOCKED' as const,
      label: 'Locked',
      description: 'Route to selected envelope',
      icon: Target
    },
    {
      value: 'SMART_AUTO' as const,
      label: 'Smart Auto',
      description: 'AI routing with rules',
      icon: Zap
    },
    {
      value: 'GENERAL_POOL' as const,
      label: 'General Pool',
      description: 'Sort transactions later',
      icon: ShoppingBag
    }
  ];

  return (
    <div 
      className={cn(
        'grid grid-cols-3 gap-1 p-1 bg-[color:var(--owl-surface-alt)] rounded-[var(--radius-sm)]',
        className
      )}
      {...dataAttributes}
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              'flex flex-col items-center gap-2 px-3 py-3 rounded-[var(--radius-sm)]',
              'text-caption transition-all duration-200',
              'touch-target min-h-[80px]',
              'focus:outline-none focus:ring-2 focus:ring-[color:var(--owl-accent)] focus:ring-offset-2',
              isActive 
                ? 'bg-[color:var(--owl-surface-alt)] text-[color:var(--owl-text-primary)] shadow-sm font-medium' 
                : 'text-[color:var(--owl-text-secondary)] hover:text-[color:var(--owl-text-primary)] hover:bg-[color:var(--owl-surface)]/60'
            )}
            data-spend-mode={mode.value}
          >
            <Icon className={cn(
              'h-5 w-5 transition-colors duration-200',
              isActive ? 'text-[color:var(--owl-accent)]' : 'text-current'
            )} />
            <div className="text-center">
              <div className="font-medium leading-tight">
                {mode.label}
              </div>
              <div className="text-xs text-[color:var(--owl-text-secondary)] mt-1 leading-tight">
                {mode.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export { SpendModeControl };
export type { SpendModeControlProps };

/*
DEV PROPS:
- value: 'LOCKED' | 'SMART_AUTO' | 'GENERAL_POOL'
- onChange: (value) => void
- data-endpoint: "POST /spend-mode"
- data-action: "update:spendMode"

SPEND MODE BEHAVIOR:
- LOCKED: Route all purchases to selected envelope
- SMART_AUTO: Use MCC, geofence, history, rules (default)
- GENERAL_POOL: Single pool, manually sort later
*/