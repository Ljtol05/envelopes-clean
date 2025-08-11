import * as React from 'react';
import owlPng from '../../assets/branding/owl.png'; // dark-mode optimized (or legacy)
import owlSvg from '../../assets/branding/owl.svg'; // provided light-mode version

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
  const showWordmark = wordmark || variant === 'full';
  // Determine current theme via prop or data-theme attribute (non-hook, safe for SSR/tests)
  const resolvedTheme = themeName || (typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null) : null) || undefined;
  const src = resolvedTheme === 'light' ? owlSvg : owlPng;
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
