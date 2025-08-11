import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../ui/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, X, DollarSign } from 'lucide-react';

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  envelopes: Array<{ id: string; name: string; balance_cents: number }>;
  onSort: (allocations: Array<{ envelope_id: string; amount_cents: number }>) => void;
  transactionId?: string;
  'data-endpoint'?: string;
  'data-action'?: string;
}

interface Allocation {
  envelope_id: string;
  amount: number;
}

const SortModal: React.FC<SortModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  envelopes,
  onSort,
  // transactionId (reserved for future API usage)
  ...dataAttributes
}) => {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { envelope_id: '', amount: 0 }
  ]);

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

  const allocatedTotal = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const remaining = totalAmount - allocatedTotal;
  const isValidSort = Math.abs(remaining) < 0.01 && allocations.every(a => a.envelope_id && a.amount > 0);

  const addAllocation = () => {
    setAllocations(prev => [...prev, { envelope_id: '', amount: 0 }]);
  };

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateAllocation = (index: number, field: keyof Allocation, value: string | number) => {
    setAllocations(prev => prev.map((allocation, i) => 
      i === index ? { ...allocation, [field]: value } : allocation
    ));
  };

  const quickSplit = (percentage: number) => {
    if (allocations.length === 1 && !allocations[0].envelope_id) return;
    
    const amount = totalAmount * (percentage / 100);
    const remainingAfterFirst = totalAmount - amount;
    const otherCount = allocations.length - 1;
    const otherAmount = otherCount > 0 ? remainingAfterFirst / otherCount : 0;

    setAllocations(prev => prev.map((allocation, index) => ({
      ...allocation,
      amount: index === 0 ? amount : otherAmount
    })));
  };

  const handleSort = () => {
    if (!isValidSort) return;

    const allocationsCents = allocations.map(allocation => ({
      envelope_id: allocation.envelope_id,
      amount_cents: Math.round(allocation.amount * 100)
    }));

    onSort(allocationsCents);
    onClose();
    
    // Reset form
    setAllocations([{ envelope_id: '', amount: 0 }]);
  };

  const availableEnvelopes = (currentIndex: number) => {
    const usedEnvelopes = allocations
      .map((a, i) => i !== currentIndex ? a.envelope_id : null)
      .filter(Boolean);
    return envelopes.filter(env => !usedEnvelopes.includes(env.id));
  };

  const resetForm = useCallback(() => {
    setAllocations([{ envelope_id: '', amount: 0 }]);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => resetForm(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen, resetForm]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-lg"
        {...dataAttributes}
      >
        <DialogHeader>
          <DialogTitle className="text-h1">Split Transaction</DialogTitle>
          <DialogDescription className="text-caption text-[color:var(--owl-text-secondary)]">
            Split this {formatCurrency(totalAmount)} transaction across multiple envelopes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Quick Split Buttons */}
          <div>
            <Label className="mb-2 block">Quick Split</Label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quickSplit(50)}
                className="text-xs"
              >
                50%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quickSplit(80)}
                className="text-xs"
              >
                80%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quickSplit(100)}
                className="text-xs"
              >
                100%
              </Button>
            </div>
          </div>

          {/* Allocations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Split Between Envelopes</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addAllocation}
                className="text-[color:var(--owl-accent)] text-xs"
                disabled={allocations.length >= envelopes.length}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Split
              </Button>
            </div>

            {allocations.map((allocation, index) => (
              <div key={index} className="space-y-3 p-3 border border-[color:var(--owl-border)] rounded-[var(--radius-sm)] bg-[color:var(--owl-surface-alt)]">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Split {index + 1}</Label>
                  {allocations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllocation(index)}
                      className="p-1 h-auto text-[color:var(--owl-text-secondary)]"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Envelope Selection */}
                  <div className="space-y-1">
                    <Label className="text-xs text-[color:var(--owl-text-secondary)]">Envelope</Label>
                    <select
                      aria-label="Select envelope for allocation"
                      value={allocation.envelope_id}
                      onChange={(e) => updateAllocation(index, 'envelope_id', e.target.value)}
                      className="w-full p-2 border border-[color:var(--owl-border)] rounded-[var(--radius-sm)] text-caption bg-[color:var(--owl-surface)]"
                    >
                      <option value="">Select envelope</option>
                      {availableEnvelopes(index).map((envelope) => (
                        <option key={envelope.id} value={envelope.id}>
                          {envelope.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1">
                    <Label className="text-xs text-[color:var(--owl-text-secondary)]">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[color:var(--owl-text-secondary)]" />
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={allocation.amount > 0 ? allocation.amount.toFixed(2) : ''}
                        onChange={(e) => updateAllocation(index, 'amount', parseAmount(e.target.value))}
                        onBlur={() => {
                          const num = allocation.amount;
                          updateAllocation(index, 'amount', isNaN(num) ? 0 : parseFloat(num.toFixed(2)));
                        }}
                        className="pl-6 text-caption"
                      />
                    </div>
                  </div>
                </div>

                {/* Envelope Balance Info */}
                {allocation.envelope_id && (
                  <div className="text-xs text-[color:var(--owl-text-secondary)]">
                    {envelopes.find(env => env.id === allocation.envelope_id)?.name}: {
                      formatCurrency(envelopes.find(env => env.id === allocation.envelope_id)?.balance_cents || 0 / 100)
                    } available
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-3 p-3 bg-[color:var(--owl-surface-alt)] rounded-[var(--radius-sm)] border border-[color:var(--owl-border)]">
            <div className="flex justify-between text-caption">
              <span>Total Amount:</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-caption">
              <span>Allocated:</span>
              <span className="font-medium">{formatCurrency(allocatedTotal)}</span>
            </div>
            <div className="flex justify-between text-caption">
              <span>Remaining:</span>
              <span className={cn(
                'font-medium',
                Math.abs(remaining) < 0.01 ? 'text-[color:var(--owl-accent)]' : 
                remaining < 0 ? 'text-[color:var(--owl-error,var(--owl-accent))]' : 'text-[color:var(--owl-warning,var(--owl-accent))]'
              )}>
                {formatCurrency(remaining)}
              </span>
            </div>

            {Math.abs(remaining) > 0.01 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs',
                    remaining < 0 ? 'bg-[color:var(--owl-error,var(--owl-accent))]/10 text-[color:var(--owl-error,var(--owl-accent))]' : 
                    'bg-[color:var(--owl-warning,var(--owl-accent))]/10 text-[color:var(--owl-warning,var(--owl-accent))]'
                  )}
                >
                  {remaining < 0 ? 'Over-allocated' : 'Under-allocated'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSort}
            disabled={!isValidSort}
            className="flex-1"
            data-action="execute:sort"
          >
            Split Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SortModal };
export type { SortModalProps };

/*
DEV PROPS:
- totalAmount: number (transaction amount to split)
- envelopes: Array<{id, name, balance_cents}>
- onSort: (allocations: Array<{envelope_id, amount_cents}>) => void
- transactionId: string (for API calls)
- data-endpoint: "POST /transactions/reallocate"
- data-action: "execute:sort"

USAGE:
- Post-spend sorting for General Pool mode
- Manual reallocation from transaction details
- Quick percentage splits (50%, 80%, 100%)
- Validates total equals transaction amount
*/