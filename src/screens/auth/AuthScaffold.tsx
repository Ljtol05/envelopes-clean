import { useContext, useEffect, type PropsWithChildren } from 'react';
import EnvelopesLogo from '../../components/common/EnvelopesLogo';
import owlBg from '../../assets/branding/owl.svg';
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
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(55%_55%_at_50%_38%,black,transparent)]"
        style={{ backgroundImage: `url(${owlBg})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center 16%', backgroundSize: '800px' }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <EnvelopesLogo variant="full" height={72} className="select-none" />
          <p className="mt-3 text-lg sm:text-xl text-[color:var(--owl-text-secondary)]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
