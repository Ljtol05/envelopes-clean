import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../components/ui/utils';
import { EnvelopeTile } from '../../components/domain/EnvelopeTile';
import { TransferModal } from '../../components/domain/TransferModal';
import { CreateEnvelopeModal } from '../../components/domain/CreateEnvelopeModal';
import { useEnvelopes } from '../../hooks/useEnvelopes';
import type { EnvelopesContextValue } from '../../contexts/EnvelopesContextBase';
import type { TEnvelope } from '../../lib/data/service';
import { Button } from '../../components/ui/button';
import { Plus, ArrowRightLeft, Wallet, Clock, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface HomeScreenProps {
  className?: string;
  balances?: Array<{
    envelope_id: string;
    name: string;
    balance_cents: number;
    spent_this_month_cents: number;
    budget_cents?: number;
  }>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

type LocalEnvelope = TEnvelope;

const HomeScreen: React.FC<HomeScreenProps> = ({
  className,
  balances,
  onRefresh,
  isLoading = false
}) => {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<'add' | 'move' | 'create'>('move');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // (Legacy sampleEnvelopes removed; data now loaded from service)

  const { envelopes: ctxEnvelopes, externalAccounts, loading, createEnvelope, transfer } = useEnvelopes() as EnvelopesContextValue;
  const [localEnvelopes, setLocalEnvelopes] = useState<LocalEnvelope[]>([]); // transient highlight mgmt
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<string[]>([]);
  const highlightTimeoutRef = useRef<number | null>(null);
  const updateHighlightTimeoutRef = useRef<number | null>(null);

  // Sync context envelopes into local state for highlight animations
  useEffect(() => { setLocalEnvelopes(ctxEnvelopes); }, [ctxEnvelopes]);
  const envelopeData = balances || localEnvelopes;
  const totalBalance = envelopeData.reduce((sum: number, env: LocalEnvelope) => sum + env.balance_cents, 0);
  const totalSpent = envelopeData.reduce((sum: number, env: LocalEnvelope) => sum + env.spent_this_month_cents, 0);
  const totalBudget = envelopeData.reduce((sum: number, env: LocalEnvelope) => sum + (env.budget_cents || 0), 0);
  const monthPct = totalBudget > 0 ? Math.min(999, (totalSpent / totalBudget) * 100) : 0;
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };

  const calculateProgressPct = (spent: number, budget?: number) => {
    if (!budget || budget === 0) return 0;
    return Math.round((spent / budget) * 100);
  };

  const getEnvelopeState = (envelope: typeof envelopeData[0]) => {
    const progressPct = calculateProgressPct(envelope.spent_this_month_cents, envelope.budget_cents);
    if (envelope.balance_cents < 1000) return 'low'; // Less than $10
    if (progressPct > 95) return 'low';
    if (envelope.envelope_id === 'groceries') return 'active'; // Sample active state
    return 'default';
  };

  const handleQuickAction = (action: 'add' | 'move' | 'create') => {
    setTransferMode(action);
    if (action === 'create') {
      setCreateModalOpen(true);
      return;
    }
    setTransferModalOpen(true);
  };
  const handleCreateEnvelope = async (name: string, initialAmount: number) => {
  const created = await createEnvelope(name, initialAmount);
  if (!created) return;
  setRecentlyAddedId(created.envelope_id);
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = window.setTimeout(() => setRecentlyAddedId(null), 3000);
    toast.success(`Envelope "${created.name}" created`);
    onRefresh?.();
  };

  const handleEnvelopeClick = (envelopeId: string) => {
    toast.info(`Navigate to ${envelopeId} details`);
  };

  const handleTransfer = async (fromId: string, toId: string, amount: number) => {
  await transfer(fromId === 'external' ? null : fromId, toId, amount);
    toast.success(`Transferred ${formatCurrency(amount * 100)} successfully`);
    onRefresh?.();
  const updatedIds: string[] = [];
  if (fromId && fromId !== 'external') updatedIds.push(fromId);
  updatedIds.push(toId);
    setRecentlyUpdatedIds(updatedIds);
    if (updateHighlightTimeoutRef.current) window.clearTimeout(updateHighlightTimeoutRef.current);
    updateHighlightTimeoutRef.current = window.setTimeout(() => setRecentlyUpdatedIds([]), 2000);
  };

  const transferEnvelopes = [
    ...envelopeData.map((env: LocalEnvelope) => ({
      id: env.envelope_id,
      name: env.name,
      balance: env.balance_cents / 100
    }))
  ];
  const externalAccountOptions = externalAccounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance_cents / 100 }));

  if (isLoading || loading) {
    return (
      <div className={cn('p-4 space-y-6', className)}>
        {/* Loading skeleton */}
        <div className="space-y-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 bg-[color:var(--owl-surface-alt)] rounded-[var(--radius-md)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn('p-4 space-y-6', className)}
      data-endpoint="GET /balances"
    >
      {/* Info Banner */}
      <div className="bg-[color:var(--owl-accent)]/10 border border-[color:var(--owl-accent)]/20 rounded-[var(--radius-md)] p-4">
        <div className="flex items-center gap-2 text-[color:var(--owl-accent)]">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-body font-medium">
              Next paycheck in 3 days
            </span>
            <span className="text-caption ml-2">• Planned splits ready</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
  <h2 className="text-h2 text-[color:var(--owl-text-primary)]">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            onClick={() => handleQuickAction('add')}
            className="flex-col h-auto py-4 gap-2 touch-target"
            data-action="open:TransferModal"
          >
            <Plus className="h-5 w-5" />
            <span className="text-caption">Add Money</span>
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleQuickAction('move')}
            className="flex-col h-auto py-4 gap-2 touch-target"
            data-action="open:TransferModal"
          >
            <ArrowRightLeft className="h-5 w-5" />
            <span className="text-caption">Move Money</span>
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleQuickAction('create')}
            className="flex-col h-auto py-4 gap-2 touch-target"
            data-action="open:CreateEnvelopeModal"
          >
            <Wallet className="h-5 w-5" />
            <span className="text-caption">Create Envelope</span>
          </Button>
        </div>
      </div>

      {/* Total Balance Summary */}
  <div className="bg-[color:var(--owl-surface)] border border-[color:var(--owl-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption text-[color:var(--owl-text-secondary)] mb-1">
              Total Available
            </p>
            <p className="text-display text-[color:var(--owl-text-primary)] font-medium">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption text-[color:var(--owl-text-secondary)] mb-1">
              This Month
            </p>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-[color:var(--owl-accent)]" />
              <span className="text-body text-[color:var(--owl-accent)] font-medium">
                {monthPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Envelopes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-[color:var(--owl-text-primary)]">Your Envelopes</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-caption"
            data-action="refresh:balances"
          >
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {envelopeData.map((envelope: LocalEnvelope) => (
            <EnvelopeTile
              key={envelope.envelope_id}
              name={envelope.name}
              balance={envelope.balance_cents / 100}
              progressPct={calculateProgressPct(envelope.spent_this_month_cents, envelope.budget_cents)}
              state={getEnvelopeState(envelope)}
              onClick={() => handleEnvelopeClick(envelope.envelope_id)}
              className={cn(
                recentlyAddedId === envelope.envelope_id && 'animate-[pulse_1.2s_ease-in-out_0s_2]',
                recentlyUpdatedIds.includes(envelope.envelope_id) && 'ring-2 ring-[color:var(--owl-accent)] ring-offset-2'
              )}
              data-envelope-id={envelope.envelope_id}
              data-endpoint="GET /balances"
              data-action="navigate:EnvelopeDetailsScreen"
            />
          ))}
        </div>

        {envelopeData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-body text-[color:var(--owl-text-secondary)] mb-4">
              No envelopes yet
            </p>
            <Button onClick={() => handleQuickAction('create')}>
              Create Your First Envelope
            </Button>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        mode={transferMode === 'add' ? 'add' : 'move'}
        envelopes={transferEnvelopes}
        externalAccounts={externalAccountOptions}
        onTransfer={handleTransfer}
        data-endpoint="POST /envelopes/transfer"
        data-action="execute:transfer"
      />

      {/* Create Envelope Modal */}
      <CreateEnvelopeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateEnvelope={handleCreateEnvelope}
  existingNames={envelopeData.map((e: LocalEnvelope) => e.name)}
        data-endpoint="POST /envelopes"
        data-action="create:envelope"
      />

      {/* Developer Notes */}
      <div className="fixed bottom-20 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded-[var(--radius-sm)] text-xs max-w-xs opacity-75 pointer-events-none z-50">
        <strong>Dev Notes:</strong><br />
        • GET /balances on mount<br />
        • Quick Actions → POST /envelopes/transfer<br />
        • Real-time balance updates<br />
        • Envelope click → navigate to details
      </div>
    </div>
  );
};

export { HomeScreen };
export type { HomeScreenProps };