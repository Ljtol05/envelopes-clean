import React from 'react';
import { cn } from '../ui/utils';

interface BrandTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent';
}

export const BrandText: React.FC<BrandTextProps> = ({ variant = 'primary', className, ...rest }) => {
  // Map variant to CSS var class to avoid inline styles
  const colorClass =
    variant === 'primary'
      ? 'text-[color:var(--owl-text-primary)]'
      : variant === 'secondary'
        ? 'text-[color:var(--owl-text-secondary)]'
        : 'text-[color:var(--owl-accent)]';
  return <span className={cn('leading-snug', colorClass, className)} {...rest} />;
};
