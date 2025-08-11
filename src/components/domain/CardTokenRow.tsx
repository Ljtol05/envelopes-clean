import React from 'react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CreditCard, Smartphone, Apple, MoreVertical } from 'lucide-react';

interface CardTokenRowProps {
  name: string;
  last4: string;
  walletStatus: 'provisioned' | 'not_provisioned';
  linkedEnvelopeId?: string;
  type?: 'physical' | 'virtual';
  onAddToWallet?: () => void;
  onManage?: () => void;
  className?: string;
  'data-card-token'?: string;
  'data-endpoint'?: string;
  'data-action'?: string;
}

const CardTokenRow: React.FC<CardTokenRowProps> = ({
  name,
  last4,
  walletStatus,
  linkedEnvelopeId,
  type = 'virtual',
  onAddToWallet,
  onManage,
  className,
  ...dataAttributes
}) => {
  const isProvisioned = walletStatus === 'provisioned';

  return (
    <div 
      className={cn(
        'flex items-center justify-between p-4 rounded-[var(--radius-md)]',
        'border border-[var(--color-neutral-200)] bg-white',
        'hover:bg-[var(--color-neutral-50)] transition-colors duration-200',
        'min-h-[80px]',
        className
      )}
      {...dataAttributes}
    >
      {/* Left Side - Card Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Card Icon */}
        <div className={cn(
          'p-3 rounded-[var(--radius-sm)] flex-shrink-0',
          type === 'physical' 
            ? 'bg-[var(--color-brand-primary)]/10' 
            : 'bg-[var(--color-neutral-100)]'
        )}>
          <CreditCard className={cn(
            'h-5 w-5',
            type === 'physical' 
              ? 'text-[var(--color-brand-primary)]' 
              : 'text-[var(--color-neutral-600)]'
          )} />
        </div>

        {/* Card Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-body font-medium text-[var(--color-neutral-900)] truncate">
              {name}
            </h4>
            {type === 'physical' && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Physical
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-caption text-[var(--color-neutral-500)] mb-1">
            <span className="text-mono">•••• {last4}</span>
            {linkedEnvelopeId && (
              <>
                <span>•</span>
                <span className="truncate">→ {linkedEnvelopeId}</span>
              </>
            )}
          </div>

          {/* Wallet Status */}
          <div className="flex items-center gap-2">
            {isProvisioned ? (
              <>
                <Apple className="h-3 w-3 text-[var(--color-neutral-400)]" />
                <Smartphone className="h-3 w-3 text-[var(--color-neutral-400)]" />
                <span className="text-caption text-[var(--color-success)] font-medium">
                  Added to wallet
                </span>
              </>
            ) : (
              <span className="text-caption text-[var(--color-neutral-500)]">
                Not in wallet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isProvisioned && onAddToWallet && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddToWallet}
            className="text-caption px-3 py-2 h-auto touch-target"
            data-action="provision:wallet"
          >
            <Apple className="h-4 w-4 mr-1" />
            Add to Wallet
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onManage}
          className="p-2 h-auto touch-target"
          data-action="open:CardManagementSheet"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { CardTokenRow };
export type { CardTokenRowProps };

/*
DEV PROPS:
- name: string (card display name)
- last4: string (last 4 digits)
- walletStatus: 'provisioned' | 'not_provisioned'
- linkedEnvelopeId: string (maps 1:1 to envelope)
- type: 'physical' | 'virtual'
- data-card-token: string (for API calls)
- data-endpoint: "POST /cards/provision"
- data-action: "provision:wallet" | "open:CardManagementSheet"
*/