// Backwards compatibility shim: re-export OwllocateLogo under old name to avoid breaking any stray imports.
import OwllocateLogo, { type OwllocateLogoProps } from './OwllocateLogo';

export type EnvelopesLogoProps = OwllocateLogoProps;

const EnvelopesLogo: React.FC<EnvelopesLogoProps> = (props) => (
  <OwllocateLogo {...props} />
);

export default EnvelopesLogo;
