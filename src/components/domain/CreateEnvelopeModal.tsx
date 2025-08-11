import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../ui/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Wallet, Loader2, DollarSign } from 'lucide-react';

interface CreateEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEnvelope: (name: string, initialAmount: number) => void;
  existingNames?: string[];
  className?: string;
  'data-endpoint'?: string;
  'data-action'?: string;
}

const CreateEnvelopeModal: React.FC<CreateEnvelopeModalProps> = ({
  isOpen,
  onClose,
  onCreateEnvelope,
  existingNames = [],
  className,
  ...dataAttributes
}) => {
  const [envelopeName, setEnvelopeName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseAmount = (value: string): number => {
    // Keep only first decimal point, remove stray characters
    let cleaned = value.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      // Remove additional dots
      const before = cleaned.slice(0, firstDot + 1);
      const after = cleaned.slice(firstDot + 1).replace(/\./g, '');
      cleaned = before + after;
    }
    return parseFloat(cleaned) || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const amount = parseAmount(initialAmount);
  const normalizedName = envelopeName.trim().toLowerCase();
  const isDuplicate = normalizedName.length > 0 && existingNames.some(n => n.trim().toLowerCase() === normalizedName);
  const canCreate = envelopeName.trim().length >= 2 && amount >= 0 && !isDuplicate;

  const handleCreate = async () => {
    if (!canCreate) return;
    
    setIsLoading(true);
    try {
      await onCreateEnvelope(envelopeName.trim(), amount);
      onClose();
      
      // Reset form
      setEnvelopeName('');
      setInitialAmount('');
    } catch (error) {
      console.error('Failed to create envelope:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCreate) {
      handleCreate();
    }
  };

  // Quick preset amounts
  const presetAmounts = [25, 50, 100, 250, 500];

  const handlePresetAmount = (preset: number) => {
    setInitialAmount(preset.toString());
  };

  // Suggested envelope names
  const suggestions = [
    'Entertainment', 'Travel', 'Clothing', 'Health & Wellness', 
    'Home Improvement', 'Gifts', 'Education', 'Emergency Fund'
  ];

  // Reset form when modal fully closes
  const resetForm = useCallback(() => {
    setEnvelopeName('');
    setInitialAmount('');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Delay reset slightly to allow closing animation (Radix unmounts after animation)
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
        className={cn('sm:max-w-md', className)}
        {...dataAttributes}
      >
        <DialogHeader>
          <DialogTitle className="text-h1 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[color:var(--owl-accent)]" />
            Create Envelope
          </DialogTitle>
          <DialogDescription className="text-caption text-[color:var(--owl-text-secondary)]">
            Create a new envelope to organize your spending by category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Envelope Name */}
          <div className="space-y-2">
            <Label htmlFor="envelope-name">Envelope Name</Label>
            <Input
              id="envelope-name"
              type="text"
              placeholder="e.g., Entertainment, Travel, Emergency"
              value={envelopeName}
              onChange={(e) => setEnvelopeName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              maxLength={50}
              autoFocus
            />
            
            {/* Character count */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-[color:var(--owl-text-secondary)]">
                {envelopeName.length}/50 characters
              </span>
              {envelopeName.length < 2 && envelopeName.length > 0 && !isDuplicate && (
                <span className="text-xs text-[color:var(--owl-warning,var(--owl-accent))]">
                  Name must be at least 2 characters
                </span>
              )}
              {isDuplicate && (
                <span className="text-xs text-[color:var(--owl-error,var(--owl-accent))]">
                  An envelope with this name already exists
                </span>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {!envelopeName && (
            <div className="space-y-2">
              <Label className="text-caption text-[color:var(--owl-text-secondary)]">
                Popular Categories
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnvelopeName(suggestion)}
                    className="text-xs h-auto py-1 px-2 border border-[color:var(--owl-border)] hover:border-[color:var(--owl-accent)] hover:text-[color:var(--owl-accent)]"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Initial Amount */}
          <div className="space-y-2">
            <Label htmlFor="initial-amount">Starting Amount (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[color:var(--owl-text-secondary)]" />
              <Input
                id="initial-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={() => {
                  // Normalize formatting on blur
                  const num = parseAmount(initialAmount);
                  setInitialAmount(num ? num.toFixed(2) : '');
                }}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-[color:var(--owl-text-secondary)]">
              You can add money to this envelope later
            </p>
          </div>

          {/* Quick Amount Presets */}
          <div className="space-y-2">
            <Label className="text-caption text-[color:var(--owl-text-secondary)]">
              Quick Amounts
            </Label>
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Badge
                  key={preset}
                  variant="secondary"
                  className={cn(
                    'cursor-pointer transition-colors duration-200 hover:bg-[color:var(--owl-accent)] hover:text-[color:var(--owl-accent-fg,var(--owl-bg))]',
                    amount === preset && 'bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))]'
                  )}
                  onClick={() => handlePresetAmount(preset)}
                >
                  ${preset}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview */}
          {envelopeName && (
            <div className="p-3 bg-[color:var(--owl-surface-alt)] rounded-[var(--radius-sm)] border border-[color:var(--owl-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body font-medium text-[color:var(--owl-text-primary)]">
                    {envelopeName}
                  </p>
                  <p className="text-caption text-[color:var(--owl-text-secondary)]">
                    Starting balance
                  </p>
                </div>
                <p className="text-h2 text-[color:var(--owl-accent)] font-medium">
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!canCreate || isLoading}
            className="flex-1"
            data-action="create:envelope"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Envelope
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CreateEnvelopeModal };
export type { CreateEnvelopeModalProps };

/*
DEV PROPS:
- envelopeName: string (envelope display name)
- initialAmount: number (starting balance in dollars)
- onCreateEnvelope: (name: string, amount: number) => void
- data-endpoint: "POST /envelopes"
- data-action: "create:envelope"

API PAYLOAD:
{
  "name": "Entertainment",
  "initial_amount_cents": 5000
}

VALIDATION:
- Name: 2-50 characters, required
- Amount: >= 0, optional (defaults to $0)
- Suggestions for common categories
- Quick preset amounts: $25, $50, $100, $250, $500
*/