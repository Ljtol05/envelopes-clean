import React, { useState } from 'react';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { CardTokenRow } from '../../components/domain/CardTokenRow';
import { SpendModeControl } from '../../components/domain/SpendModeControl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { Badge } from '../../components/ui/badge';
import { CreditCard, Zap } from 'lucide-react';

interface CardScreenProps {
  className?: string;
  onSimulateSwipe?: () => void;
  onAddToWallet?: (cardName: string) => void;
}

const CardScreen: React.FC<CardScreenProps> = ({
  className,
  onSimulateSwipe,
  onAddToWallet
}) => {
  const [spendMode, setSpendMode] = useState<'LOCKED' | 'SMART_AUTO' | 'GENERAL_POOL'>('SMART_AUTO');
  const [selectedEnvelope, setSelectedEnvelope] = useState('groceries');
  const [confidenceLevel, setConfidenceLevel] = useState([75]);

  const envelopes = [
    { id: 'groceries', name: 'Groceries', balance: 420.12 },
    { id: 'dining', name: 'Dining', balance: 86.50 },
    { id: 'gas', name: 'Gas', balance: 110.00 },
    { id: 'bills', name: 'Bills', balance: 1245.00 },
    { id: 'buffer', name: 'Buffer', balance: 300.00 },
    { id: 'misc', name: 'Misc', balance: 75.00 }
  ];

  const categoryCards = [
    { 
      name: 'Groceries Card', 
      last4: '4521', 
      linkedEnvelopeId: 'groceries', 
      walletStatus: 'provisioned' as const 
    },
    { 
      name: 'Dining Card', 
      last4: '8834', 
      linkedEnvelopeId: 'dining', 
      walletStatus: 'not_provisioned' as const 
    },
    { 
      name: 'Gas Card', 
      last4: '2157', 
      linkedEnvelopeId: 'gas', 
      walletStatus: 'provisioned' as const 
    },
    { 
      name: 'Shopping Card', 
      last4: '9943', 
      linkedEnvelopeId: 'misc', 
      walletStatus: 'not_provisioned' as const 
    },
    { 
      name: 'Bills Card', 
      last4: '7765', 
      linkedEnvelopeId: 'bills', 
      walletStatus: 'not_provisioned' as const 
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const selectedEnvelopeData = envelopes.find(env => env.id === selectedEnvelope);

  return (
    <div 
      className={cn('p-4 space-y-6', className)}
      data-endpoint="GET /cards"
    >
      {/* Physical Smart Card Section */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)]">Smart Card</h2>
        
        {/* Physical Card Preview */}
        <div className="relative p-6 bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-primary-hover)] rounded-[var(--radius-md)] text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-caption opacity-80">Envelopes</p>
              <p className="text-h2 font-medium">Smart Card</p>
            </div>
            <CreditCard className="h-8 w-8 opacity-80" />
          </div>
          
          <div className="mt-6">
            <p className="text-caption opacity-80">•••• •••• •••• 1234</p>
            <p className="text-caption opacity-80 mt-2">
              Funding: {spendMode === 'LOCKED' ? `${selectedEnvelopeData?.name} (Locked)` : 
                       spendMode === 'SMART_AUTO' ? 'Smart Auto Routing' : 
                       'General Pool'}
            </p>
          </div>
        </div>

        {/* Simulate Swipe Button */}
        <Button
          variant="secondary"
          onClick={onSimulateSwipe}
          className="w-full touch-target"
          data-action="simulate:transaction"
          data-endpoint="POST /webhooks/processor/authorization"
        >
          <Zap className="h-4 w-4 mr-2" />
          Simulate Swipe (Demo)
        </Button>
      </div>

      {/* Spend Mode Control */}
      <div className="space-y-4">
        <h3 className="text-h2 text-[var(--color-neutral-900)]">Spend Mode</h3>
        
        <SpendModeControl
          value={spendMode}
          onChange={setSpendMode}
          data-endpoint="POST /spend-mode"
          data-action="update:spendMode"
        />

        {/* Mode-specific Controls */}
        {spendMode === 'LOCKED' && (
          <div className="space-y-3">
            <p className="text-caption text-[var(--color-neutral-600)]">
              Route all purchases to the envelope you select.
            </p>
            <div className="space-y-2">
              <label className="text-body font-medium text-[var(--color-neutral-900)]">
                Locked Envelope
              </label>
              <Select value={selectedEnvelope} onValueChange={setSelectedEnvelope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {envelopes.map((envelope) => (
                    <SelectItem key={envelope.id} value={envelope.id}>
                      {envelope.name} • {formatCurrency(envelope.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEnvelopeData && (
              <div className="p-3 bg-[var(--color-brand-primary)]/10 rounded-[var(--radius-sm)] border border-[var(--color-brand-primary)]/20">
                <p className="text-caption text-[var(--color-brand-primary)] font-medium">
                  Available: {formatCurrency(selectedEnvelopeData.balance)}
                </p>
              </div>
            )}
          </div>
        )}

        {spendMode === 'SMART_AUTO' && (
          <div className="space-y-4">
            <p className="text-caption text-[var(--color-neutral-600)]">
              We'll choose using merchant, MCC, and location.
            </p>
            
            {/* Confidence Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-body font-medium text-[var(--color-neutral-900)]">
                  Confidence Level
                </label>
                <Badge variant="secondary" className="text-xs">
                  {confidenceLevel[0]}%
                </Badge>
              </div>
              <div className="space-y-2">
                <Slider
                  value={confidenceLevel}
                  onValueChange={setConfidenceLevel}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-caption text-[var(--color-neutral-500)]">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Fallback Chain Info */}
            <div className="p-3 bg-[var(--color-neutral-50)] rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)]">
              <p className="text-caption text-[var(--color-neutral-600)]">
                <strong>Fallback chain:</strong> Locked → Rule → Auto → General Pool (if on) → Buffer → Decline
              </p>
            </div>
          </div>
        )}

        {spendMode === 'GENERAL_POOL' && (
          <div className="space-y-3">
            <p className="text-caption text-[var(--color-neutral-600)]">
              Spend from one pool. Sort later.
            </p>
            <div className="p-3 bg-[var(--color-warning)]/10 rounded-[var(--radius-sm)] border border-[var(--color-warning)]/20">
              <p className="text-caption text-[var(--color-warning)] font-medium">
                ⚠️ You'll need to manually sort transactions into envelopes later
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Cards Section */}
      <div className="space-y-4">
        <h3 className="text-h2 text-[var(--color-neutral-900)]">Category Cards</h3>
        <p className="text-caption text-[var(--color-neutral-600)]">
          Virtual cards linked 1:1 to your envelopes
        </p>
        
        <div className="space-y-3">
          {categoryCards.map((card) => (
            <CardTokenRow
              key={card.last4}
              name={card.name}
              last4={card.last4}
              linkedEnvelopeId={card.linkedEnvelopeId}
              walletStatus={card.walletStatus}
              type="virtual"
              onAddToWallet={() => onAddToWallet?.(card.name)}
              data-card-token={card.linkedEnvelopeId}
              data-endpoint="POST /cards/provision"
              data-action="provision:wallet"
            />
          ))}
        </div>
      </div>

      {/* Developer Notes */}
      <div className="fixed bottom-20 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded-[var(--radius-sm)] text-xs max-w-xs opacity-75 pointer-events-none z-50">
        <strong>Dev Notes:</strong><br />
        • CardTokenRow prop linkedEnvelopeId maps 1:1<br />
        • Confidence affects auto-routing<br />
        • Wallet provisioning via Apple/Google Pay APIs<br />
        • POST /spend-mode updates routing behavior
      </div>
    </div>
  );
};

export { CardScreen };
export type { CardScreenProps };