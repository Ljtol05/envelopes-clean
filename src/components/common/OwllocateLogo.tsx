import * as React from 'react';
import owlPng from '../../assets/branding/owl.png';

export type OwllocateLogoVariant = 'icon' | 'full';

export interface OwllocateLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'style'> {
  variant?: OwllocateLogoVariant;
  title?: string; // accessible label
  wordmark?: boolean; // alias of variant === 'full'
  wordmarkText?: string; // override displayed text when full
}

const OwllocateLogo: React.FC<OwllocateLogoProps> = ({
  width = 40,
  height = 40,
  variant = 'icon',
  title = 'Owllocate',
  wordmark,
  wordmarkText = 'Owllocate',
  className,
  ...rest
}) => {
  const showWordmark = wordmark || variant === 'full';
  // For now we only have one raster size; browsers downscale smoothly. Later we can add srcSet once more sizes exist.
  // Map height to a font size utility (approx). Fallback to text-lg.
  const pxHeight = Number(height) || 40;
  const fontClass = pxHeight >= 56 ? 'text-3xl' : pxHeight >= 48 ? 'text-2xl' : pxHeight >= 40 ? 'text-xl' : 'text-lg';
  return (
    <span className={['inline-flex items-center', showWordmark ? 'gap-2' : '', className].filter(Boolean).join(' ')}>
      <img
        src={owlPng}
        width={width}
        height={height}
        alt={title}
        loading="lazy"
        {...rest}
      />
      {showWordmark && (
        <span className={['font-semibold tracking-tight leading-none', fontClass].join(' ')}>{wordmarkText}</span>
      )}
    </span>
  );
};

export default OwllocateLogo;
