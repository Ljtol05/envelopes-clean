import * as React from 'react';
import owlDark from '../../assets/branding/owl-dark-logo.png';
import owlLight from '../../assets/branding/owl-light-logo.png';
import { useContext } from 'react';
import { ThemeContext } from '../../theme/context';

export type OwllocateLogoVariant = 'icon' | 'full';

export interface OwllocateLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'style'> {
  variant?: OwllocateLogoVariant;
  title?: string; // accessible label
  wordmark?: boolean; // alias of variant === 'full'
  wordmarkText?: string; // override displayed text when full
  themeName?: 'light' | 'dark'; // allow explicit override to avoid hook usage inside generic component
}

const OwllocateLogo: React.FC<OwllocateLogoProps> = ({
  width = 40,
  height = 40,
  variant = 'icon',
  title = 'Owllocate',
  wordmark,
  wordmarkText = 'Owllocate',
  className,
  themeName,
  ...rest
}) => {
  // Read theme from context so this component re-renders when theme toggles
  // Allow explicit override via prop for rare cases (e.g., storybook controls)
  const themeCtx = useContext(ThemeContext);
  const showWordmark = wordmark || variant === 'full';
  // Determine current theme via prop or data-theme attribute (non-hook, safe for SSR/tests)
  const resolvedTheme =
    themeName ||
    (themeCtx ? themeCtx.name : (typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null) : null)) ||
    undefined;
  const src = resolvedTheme === 'light' ? owlLight : owlDark;
  const logoModeClass = resolvedTheme ? `logo-${resolvedTheme}` : 'logo-unknown';
  // For now we only have one raster size; browsers downscale smoothly. Later we can add srcSet once more sizes exist.
  // Map height to a font size utility (approx). Fallback to text-lg.
  const pxHeight = Number(height) || 40;
  const fontClass = pxHeight >= 56 ? 'text-3xl' : pxHeight >= 48 ? 'text-2xl' : pxHeight >= 40 ? 'text-xl' : 'text-lg';
  return (
    <span className={['inline-flex items-center', showWordmark ? 'gap-2' : '', className].filter(Boolean).join(' ')}>
      <img
        src={src}
        width={width}
        height={height}
        alt={title}
        loading="lazy"
        data-theme-logo={resolvedTheme || 'unknown'}
        className={logoModeClass}
        {...rest}
      />
      {showWordmark && (
        <span className={['font-semibold tracking-tight leading-none', fontClass].join(' ')}>{wordmarkText}</span>
      )}
    </span>
  );
};

export default OwllocateLogo;
