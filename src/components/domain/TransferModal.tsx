import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../ui/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowRight } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromEnvelope?: string;
  toEnvelope?: string;
  envelopes: Array<{ id: string; name: string; balance: number }>;
  onTransfer: (fromId: string, toId: string, amount: number) => void;
  mode?: 'move' | 'add';
  externalAccounts?: Array<{ id: string; name: string; balance: number }>;
  'data-endpoint'?: string;
  'data-action'?: string;
}

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  fromEnvelope,
  toEnvelope,
  envelopes,
  onTransfer,
  mode = 'move',
  externalAccounts = [],
  ...dataAttributes
}) => {
  const [selectedFrom, setSelectedFrom] = useState(fromEnvelope || '');
  const [selectedTo, setSelectedTo] = useState(toEnvelope || '');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const parseAmount = (value: string): number => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      const before = cleaned.slice(0, firstDot + 1);
      const after = cleaned.slice(firstDot + 1).replace(/\./g, '');
      cleaned = before + after;
    }
    return parseFloat(cleaned) || 0;
  };

  const sourceOptions = mode === 'add' ? externalAccounts : envelopes;
  const fromSourceData = sourceOptions.find(src => src.id === selectedFrom);
  const toEnvelopeData = envelopes.find(env => env.id === selectedTo);
  const transferAmount = parseAmount(amount);

  const canTransfer = Boolean(selectedFrom && selectedTo && selectedFrom !== selectedTo && transferAmount > 0 && (
    mode === 'add' ? true : (fromSourceData && transferAmount <= fromSourceData.balance)
  ));

  const handleTransfer = useCallback(async () => {
    if (!canTransfer) return;
    
    setIsLoading(true);
    try {
  const fromIdForCallback = mode === 'add' ? selectedFrom : selectedFrom; // selectedFrom now holds external account id in add mode
  await onTransfer(mode === 'add' ? fromIdForCallback : selectedFrom, selectedTo, transferAmount);
      onClose();
      // Reset form
      setAmount('');
      setSelectedFrom(fromEnvelope || '');
      setSelectedTo(toEnvelope || '');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canTransfer, onTransfer, selectedFrom, selectedTo, transferAmount, fromEnvelope, toEnvelope, onClose, mode]);

  const resetForm = useCallback(() => {
    setAmount('');
    setSelectedFrom(fromEnvelope || '');
    setSelectedTo(toEnvelope || '');
    setIsLoading(false);
  }, [fromEnvelope, toEnvelope]);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => resetForm(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen, resetForm]);

  // Auto focus amount when both selections made
  useEffect(() => {
    if (isOpen && selectedFrom && selectedTo) {
      amountInputRef.current?.focus();
    }
  }, [isOpen, selectedFrom, selectedTo]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const title = mode === 'add' ? 'Add Money' : 'Move Money';
  const description = mode === 'add'
    ? 'Add money from an external account into one of your envelopes.'
    : 'Transfer money between your envelopes to manage your budget.';

  const centralActionEnabled = canTransfer;

  // Keyboard shortcut: Enter triggers action if possible
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && centralActionEnabled) {
        e.preventDefault();
        handleTransfer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, centralActionEnabled, handleTransfer]);
  

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        {...dataAttributes}
      >
        <DialogHeader>
          <DialogTitle className="text-h1">{title}</DialogTitle>
          <DialogDescription className="text-caption text-[color:var(--owl-text-secondary)]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="from-envelope">{mode === 'add' ? 'From Account' : 'From Envelope'}</Label>
            <Select value={selectedFrom} onValueChange={setSelectedFrom}>
              <SelectTrigger id="from-envelope">
                <SelectValue placeholder={mode === 'add' ? 'Select account' : 'Select source envelope'} />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions
                  .filter(src => src.id !== selectedTo)
                  .map(src => (
                    <SelectItem key={src.id} value={src.id}>
                      {src.name} • {formatCurrency(src.balance)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {fromSourceData && (
              <p className="text-caption text-[color:var(--owl-text-secondary)]">Available: {formatCurrency(fromSourceData.balance)}</p>
            )}
          </div>

          {/* Transfer Arrow */}
          <div className="flex justify-center">
            <button
              type="button"
              disabled={!centralActionEnabled}
              onClick={handleTransfer}
              aria-label={mode === 'add' ? 'Add money' : 'Move money'}
              className={cn(
                "relative inline-flex items-center justify-center h-12 w-12 rounded-full transition-colors shadow-md",
                centralActionEnabled
                  ? "bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))] ring-2 ring-[color:var(--owl-accent)] hover:brightness-110 active:scale-95"
                  : "bg-[color:var(--owl-surface-alt)] text-[color:var(--owl-text-secondary)] opacity-60 cursor-not-allowed"
              )}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Destination Selection */}
          <div className="space-y-2">
            <Label htmlFor="to-envelope">To Envelope</Label>
            <Select value={selectedTo} onValueChange={setSelectedTo}>
              <SelectTrigger id="to-envelope">
                <SelectValue placeholder="Select destination envelope" />
              </SelectTrigger>
              <SelectContent>
                {envelopes
                  .filter(env => env.id !== selectedFrom)
                  .map((envelope) => (
                    <SelectItem key={envelope.id} value={envelope.id}>
                      {envelope.name} • {formatCurrency(envelope.balance)}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--owl-text-secondary)]">
                $
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => {
                  const num = parseAmount(amount);
                  setAmount(num ? num.toFixed(2) : '');
                }}
                className="pl-8"
                data-input="currency"
                ref={amountInputRef}
              />
            </div>
            {transferAmount > 0 && fromSourceData && mode !== 'add' && transferAmount > fromSourceData.balance && (
              <p className="text-caption text-[color:var(--owl-error,var(--owl-accent))]">
                Amount exceeds available balance
              </p>
            )}
          </div>

          {/* Summary */}
          {canTransfer && fromSourceData && toEnvelopeData && (
            <div className="p-3 bg-[color:var(--owl-surface-alt)] rounded-[var(--radius-md)] space-y-2 border border-[color:var(--owl-border)]">
              <p className="text-caption text-[color:var(--owl-text-secondary)]">{mode === 'add' ? 'Add Summary:' : 'Transfer Summary:'}</p>
              <div className="flex justify-between text-body">
                <span>From {fromSourceData.name}:</span>
                <span>-{formatCurrency(transferAmount)}</span>
              </div>
              <div className="flex justify-between text-body">
                <span>To {toEnvelopeData.name}:</span>
                <span className="text-[color:var(--owl-accent)]">+{formatCurrency(transferAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions (only Cancel retained; central button performs transfer) */}
        <div className="flex pt-4">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { TransferModal };
export type { TransferModalProps };

/*
DEV PROPS:
- fromEnvelope: string (pre-selected source)
- toEnvelope: string (pre-selected destination) 
- envelopes: Array<{id, name, balance}>
- onTransfer: (fromId, toId, amount) => void
- data-endpoint: "POST /envelopes/transfer"
- data-action: "execute:transfer"

API PAYLOAD:
{
  "from_envelope_id": "groceries",
  "to_envelope_id": "dining", 
  "amount_cents": 2500
}
*/