import React, { useState } from 'react';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { MCCChip } from '../../components/domain/MCCChip';
import { ReasonChip } from '../../components/domain/ReasonChip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Clock, MapPin, CreditCard, Receipt, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  merchant_name: string;
  amount_cents: number;
  tip_cents?: number;
  envelope_id: string;
  envelope_name: string;
  status: 'preauth' | 'captured' | 'settled' | 'declined';
  mcc_code: string;
  merchant_id: string;
  card_last4: string;
  timestamp: string;
  location?: {
    address: string;
    city: string;
    state: string;
  };
  decision_reasons: Array<'mcc_match' | 'geofence' | 'user_active' | 'rule_match' | 'fallback_general_pool' | 'fallback_buffer'>;
  auth_amount_cents?: number; // For pre-auth transactions
  receipt_url?: string;
  can_undo: boolean;
  undo_window_expires_at?: string;
}

interface TransactionDetailsScreenProps {
  transaction?: Transaction;
  envelopes?: Array<{ id: string; name: string; balance_cents: number }>;
  onBack: () => void;
  onUndo?: (transactionId: string) => void;
  onReallocate?: (transactionId: string, newEnvelopeId: string) => void;
  onCreateRule?: (transaction: Transaction) => void;
  className?: string;
}

const TransactionDetailsScreen: React.FC<TransactionDetailsScreenProps> = ({
  transaction,
  envelopes,
  onBack,
  onUndo,
  onReallocate,
  onCreateRule,
  className
}) => {
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState('');

  // Sample transaction data
  const sampleTransaction: Transaction = transaction || {
    id: 'txn_abc123',
    merchant_name: 'KROGER #842',
    amount_cents: 12745,
    envelope_id: 'groceries',
    envelope_name: 'Groceries',
    status: 'settled',
    mcc_code: '5411',
    merchant_id: 'mid_kroger_842',
    card_last4: '1234',
    timestamp: '2025-01-08T14:23:15Z',
    location: {
      address: '2950 Cobb Pkwy',
      city: 'Atlanta',
      state: 'GA'
    },
    decision_reasons: ['mcc_match', 'geofence'],
    can_undo: true,
    undo_window_expires_at: '2025-01-08T15:23:15Z'
  };

  const sampleEnvelopes = envelopes || [
    { id: 'groceries', name: 'Groceries', balance_cents: 42012 },
    { id: 'dining', name: 'Dining', balance_cents: 8650 },
    { id: 'gas', name: 'Gas', balance_cents: 11000 },
    { id: 'bills', name: 'Bills', balance_cents: 124500 },
    { id: 'misc', name: 'Misc', balance_cents: 7500 }
  ];

  const txn = sampleTransaction;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'preauth': return 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20';
      case 'captured': return 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20';
      case 'settled': return 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20';
      case 'declined': return 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20';
      default: return 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]';
    }
  };

  const getMCCDescription = (mccCode: string) => {
    const mccMap: Record<string, string> = {
      '5411': 'Grocery Stores, Supermarkets',
      '5814': 'Fast Food Restaurants',
      '5542': 'Automated Fuel Dispensers',
      '5311': 'Department Stores',
      '5812': 'Eating Places, Restaurants',
      '5541': 'Service Stations'
    };
    return mccMap[mccCode] || 'Other';
  };

  const handleUndo = () => {
    onUndo?.(txn.id);
    toast.success('Transaction undone - balance restored');
    onBack();
  };

  const handleReallocate = () => {
    if (!selectedEnvelope) {
      toast.error('Please select an envelope');
      return;
    }

    const newEnvelope = sampleEnvelopes.find(env => env.id === selectedEnvelope);
    if (!newEnvelope) return;

    onReallocate?.(txn.id, selectedEnvelope);
    toast.success(`Moved to ${newEnvelope.name}`);
    setReallocateModalOpen(false);
    onBack();
  };

  const handleCreateRule = () => {
    onCreateRule?.(txn);
    toast.success('Rule created from this transaction');
    // Navigate to rules screen would happen here
  };

  const { date, time } = formatDateTime(txn.timestamp);
  const undoExpiry = txn.undo_window_expires_at ? new Date(txn.undo_window_expires_at) : null;
  const undoTimeLeft = undoExpiry ? Math.max(0, Math.floor((undoExpiry.getTime() - Date.now()) / (1000 * 60))) : 0;

  return (
    <div 
      className={cn('min-h-screen bg-[var(--color-neutral-50)]', className)}
      data-endpoint="GET /transactions/:id"
    >
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-neutral-200)] px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 h-auto"
            data-action="navigate:back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-h1 text-[var(--color-neutral-900)] truncate">
              Transaction Details
            </h1>
            <p className="text-caption text-[var(--color-neutral-500)]">
              {txn.id}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Transaction Summary */}
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)] p-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-display text-[var(--color-neutral-900)] font-medium">
                {formatCurrency(txn.amount_cents)}
              </h2>
              {txn.tip_cents && txn.tip_cents > 0 && (
                <p className="text-caption text-[var(--color-neutral-500)]">
                  Including {formatCurrency(txn.tip_cents)} tip
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-h2 text-[var(--color-neutral-900)] mb-2">
                {txn.merchant_name}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <Badge className={cn('text-xs border', getStatusColor(txn.status))}>
                  {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {txn.envelope_name}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-neutral-200)]">
          {/* Date & Time */}
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--color-neutral-400)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-[var(--color-neutral-900)]">
                {date}
              </p>
              <p className="text-caption text-[var(--color-neutral-500)]">
                {time}
              </p>
            </div>
          </div>

          {/* Location */}
          {txn.location && (
            <div className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[var(--color-neutral-400)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-[var(--color-neutral-900)]">
                  {txn.location.address}
                </p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  {txn.location.city}, {txn.location.state}
                </p>
              </div>
            </div>
          )}

          {/* Card Used */}
          <div className="p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[var(--color-neutral-400)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-[var(--color-neutral-900)]">
                Smart Card
              </p>
              <p className="text-caption text-[var(--color-neutral-500)] text-mono">
                •••• {txn.card_last4}
              </p>
            </div>
          </div>

          {/* Pre-auth Amount */}
          {txn.auth_amount_cents && txn.auth_amount_cents !== txn.amount_cents && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-[var(--color-warning)]">
                <AlertCircle className="h-4 w-4" />
                <p className="text-caption font-medium">
                  Pre-authorized for {formatCurrency(txn.auth_amount_cents)}
                </p>
              </div>
              <p className="text-caption text-[var(--color-neutral-500)] mt-1">
                Final amount: {formatCurrency(txn.amount_cents)}
              </p>
            </div>
          )}
        </div>

        {/* Routing Decision */}
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-[var(--color-neutral-200)]">
            <h3 className="text-h2 text-[var(--color-neutral-900)] mb-2">
              Why this envelope?
            </h3>
            <p className="text-caption text-[var(--color-neutral-500)]">
              Decision factors for routing to {txn.envelope_name}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* MCC Info */}
            <div className="flex items-center gap-3">
              <MCCChip mccCode={txn.mcc_code} data-mcc={txn.mcc_code} />
              <p className="text-caption text-[var(--color-neutral-600)]">
                {getMCCDescription(txn.mcc_code)}
              </p>
            </div>

            {/* Decision Reasons */}
            <div>
              <p className="text-caption text-[var(--color-neutral-600)] mb-2">
                Routing factors:
              </p>
              <div className="flex flex-wrap gap-2">
                {txn.decision_reasons.map((reason, index) => (
                  <ReasonChip 
                    key={index} 
                    reason={reason}
                    data-reason={reason}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Undo */}
          {txn.can_undo && undoTimeLeft > 0 && (
            <Button
              variant="secondary"
              onClick={handleUndo}
              className="w-full"
              data-action="undo:transaction"
              data-endpoint="POST /transactions/undo"
            >
              Undo Transaction ({undoTimeLeft} min left)
            </Button>
          )}

          {/* Reallocate */}
          <Button
            variant="secondary"
            onClick={() => setReallocateModalOpen(true)}
            className="w-full"
            data-action="open:ReallocateModal"
          >
            Move to Different Envelope
          </Button>

          {/* Create Rule */}
          <Button
            variant="secondary"
            onClick={handleCreateRule}
            className="w-full"
            data-action="create:rule"
            data-endpoint="POST /rules"
          >
            Create Rule from This Transaction
          </Button>

          {/* Receipt Upload */}
          <Button
            variant="ghost"
            className="w-full"
            data-action="upload:receipt"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Add Receipt
          </Button>
        </div>

        {/* Reallocate Modal */}
        <Dialog open={reallocateModalOpen} onOpenChange={setReallocateModalOpen}>
          <DialogContent 
            className="sm:max-w-md"
            data-endpoint="POST /transactions/reallocate"
          >
            <DialogHeader>
              <DialogTitle>Move Transaction</DialogTitle>
              <DialogDescription className="text-caption text-[var(--color-neutral-500)]">
                Move this {formatCurrency(txn.amount_cents)} transaction to a different envelope.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-body font-medium">Choose New Envelope</label>
                <Select value={selectedEnvelope} onValueChange={setSelectedEnvelope}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select envelope" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleEnvelopes
                      .filter(env => env.id !== txn.envelope_id)
                      .map((envelope) => (
                        <SelectItem key={envelope.id} value={envelope.id}>
                          {envelope.name} • {formatCurrency(envelope.balance_cents)}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setReallocateModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReallocate}
                disabled={!selectedEnvelope}
                className="flex-1"
                data-action="execute:reallocate"
              >
                Move Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Developer Notes */}
      <div className="fixed bottom-4 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded-[var(--radius-sm)] text-xs max-w-xs opacity-75 pointer-events-none z-50">
        <strong>Dev Notes:</strong><br />
        • GET /transactions/:id<br />
        • POST /transactions/undo<br />
        • POST /transactions/reallocate<br />
        • Undo window: 60min default
      </div>
    </div>
  );
};

export { TransactionDetailsScreen };
export type { TransactionDetailsScreenProps, Transaction };