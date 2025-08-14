import React, { useContext, useEffect, type PropsWithChildren } from 'react';
void React; // ensure React in scope for test environment
import './auth-scaffold.css';
import { ThemeContext } from '../../theme/context';

export default function AuthScaffold({ children, subtitle = 'Welcome back to budgeting that feels right.' }: PropsWithChildren<{ subtitle?: string }>) {
  const theme = useContext(ThemeContext);
  useEffect(() => {
    const prev = theme?.name;
    theme?.setTheme('dark');
    return () => {
      if (prev) theme?.setTheme(prev);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-dvh bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)] flex items-center justify-center p-6 overflow-hidden">
      {/* Background illustration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 auth-owl-bg [mask-image:radial-gradient(55%_55%_at_50%_38%,black,transparent)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-3xl font-semibold tracking-tight select-none">Owllocate</h1>
          <p className="mt-3 text-lg sm:text-xl text-[color:var(--owl-text-secondary)]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
