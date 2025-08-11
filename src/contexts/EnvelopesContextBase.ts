import { createContext } from 'react';
import type { TEnvelope, TExternalAccount } from '../lib/data/service';

export interface EnvelopesContextValue {
  envelopes: TEnvelope[];
  externalAccounts: TExternalAccount[];
  loading: boolean;
  creating: boolean;
  transferring: boolean;
  createEnvelope: (name: string, initialAmount: number) => Promise<TEnvelope | null>;
  transfer: (fromId: string | null, toId: string, amount: number) => Promise<void>;
  refresh: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

export const EnvelopesContext = createContext<EnvelopesContextValue | undefined>(undefined);
