// src/components/BrandButton.tsx
import React from 'react';
import { cn } from '../ui/utils';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  title: string;
}

export default function BrandButton({ title, variant = 'primary', className, ...rest }: BrandButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-[12px] px-4 py-3 font-semibold text-sm transition-colors border';
  const variants: Record<string, string> = {
  primary: 'bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))] border-[color:var(--owl-accent)] hover:bg-[color:var(--owl-accent-hover)]',
    outline: 'bg-transparent text-[color:var(--owl-accent)] border-[color:var(--owl-accent)] hover:bg-[color:var(--owl-accent)]/10',
    ghost: 'bg-transparent text-[color:var(--owl-accent)] border-transparent hover:bg-[color:var(--owl-accent)]/10'
  };
  return (
    <button
      type="button"
      className={cn(base, variants[variant], className)}
      {...rest}
    >
      {title}
    </button>
  );
}