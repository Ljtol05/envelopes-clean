import { useContext } from 'react';
import { EnvelopesContext } from '../contexts/EnvelopesContextBase';

export function useEnvelopes() {
  const ctx = useContext(EnvelopesContext);
  if (!ctx) throw new Error('useEnvelopes must be used within EnvelopesProvider');
  return ctx;
}
