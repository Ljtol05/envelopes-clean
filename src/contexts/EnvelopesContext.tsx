import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { localEnvelopeService } from '../lib/data/service';
import { EnvelopesContext, type EnvelopesContextValue } from './EnvelopesContextBase';

interface ProviderProps { children: ReactNode; mockLatencyMs?: number | [number, number]; }

function resolveLatency(spec?: number | [number, number]) {
  if (!spec) return 0;
  if (Array.isArray(spec)) {
    const [min, max] = spec; return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return spec;
}

export const EnvelopesProvider: React.FC<ProviderProps> = ({ children, mockLatencyMs }) => {
  const [envelopes, setEnvelopes] = useState<EnvelopesContextValue['envelopes']>([]);
  const [externalAccounts, setExternalAccounts] = useState<EnvelopesContextValue['externalAccounts']>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const latency = resolveLatency(mockLatencyMs);
      if (latency) await delay(latency);
      const [envs, accts] = await Promise.all([
        localEnvelopeService.getEnvelopes(),
        localEnvelopeService.getExternalAccounts()
      ]);
      setEnvelopes(envs);
      setExternalAccounts(accts);
    } finally {
      setLoading(false);
    }
  }, [mockLatencyMs]);

  useEffect(() => { refresh(); }, [refresh]);

  const createEnvelope = useCallback<EnvelopesContextValue['createEnvelope']>(async (name: string, initialAmount: number) => {
    setCreating(true);
    try {
      const latency = resolveLatency(mockLatencyMs); if (latency) await delay(latency);
      const created = await localEnvelopeService.createEnvelope({ name, initial_amount_cents: Math.round(initialAmount * 100) });
      setEnvelopes(prev => [...prev, created]);
      return created;
    } catch (e) {
      console.error(e); return null;
    } finally { setCreating(false); }
  }, [mockLatencyMs]);

  const transfer = useCallback<EnvelopesContextValue['transfer']>(async (fromId: string | null, toId: string, amount: number) => {
    setTransferring(true);
    try {
      const latency = resolveLatency(mockLatencyMs); if (latency) await delay(latency);
      const cents = Math.round(amount * 100);
      // External account add => fromId matches an externalAccount id OR null (legacy)
      const external = fromId ? externalAccounts.find(a => a.id === fromId) : undefined;
      if (external || fromId === null) {
        const acctId = external ? external.id : externalAccounts[0]?.id;
        if (!acctId) throw new Error('No external account available');
        const res = await localEnvelopeService.transferFromExternal({ external_account_id: acctId, to_envelope_id: toId, amount_cents: cents });
        setEnvelopes(prev => prev.map(env => env.envelope_id === res.to_envelope_id ? { ...env, balance_cents: res.new_to_balance_cents } : env));
        setExternalAccounts(prev => prev.map(a => a.id === res.external_account_id ? { ...a, balance_cents: res.new_external_balance_cents } : a));
        return;
      }
      // Standard envelope->envelope move
      const result = await localEnvelopeService.transfer({
        from_envelope_id: fromId,
        to_envelope_id: toId,
        amount_cents: cents
      });
      setEnvelopes(prev => prev.map(env => {
        if (result.from_envelope_id && env.envelope_id === result.from_envelope_id) {
          return { ...env, balance_cents: result.new_from_balance_cents ?? env.balance_cents };
        }
        if (env.envelope_id === result.to_envelope_id) {
          return { ...env, balance_cents: result.new_to_balance_cents ?? env.balance_cents };
        }
        return env;
      }));
    } catch (e) { console.error(e); } finally { setTransferring(false); }
  }, [mockLatencyMs, externalAccounts]);

  const resetDemo = useCallback(async () => {
    await localEnvelopeService.resetDemo();
    await refresh();
  }, [refresh]);

  const value: EnvelopesContextValue = {
    envelopes,
    externalAccounts,
    loading,
    creating,
    transferring,
    createEnvelope,
    transfer,
    refresh,
    resetDemo
  };

  return <EnvelopesContext.Provider value={value}>{children}</EnvelopesContext.Provider>;
};

// (Hook moved to separate file to satisfy fast refresh guidance)
