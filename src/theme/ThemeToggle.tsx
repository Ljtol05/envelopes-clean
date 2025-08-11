import React from 'react';
import { useTheme } from './utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { name, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
  className={['px-3 py-1 rounded-md text-caption bg-[color:var(--owl-surface-alt)] border border-[color:var(--owl-border)] hover:bg-[color:var(--owl-accent)] hover:text-[color:var(--owl-accent-fg,var(--owl-bg))] transition-colors', className].filter(Boolean).join(' ')}
    >
      {name === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};
