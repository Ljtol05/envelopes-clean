import React, { useState } from 'react';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { CardTokenRow } from '../../components/domain/CardTokenRow';
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Settings2,
  DollarSign,
  Percent,
  ChevronRight,
  Lock,
  Trash2,
} from 'lucide-react';

interface SettingsScreenProps {
  className?: string;
}

type SpendMode = 'LOCKED' | 'SMART_AUTO' | 'GENERAL_POOL';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ className }) => {
  // Settings state
  const [defaultSpendMode, setDefaultSpendMode] = useState<SpendMode>('SMART_AUTO');
  const [generalPoolEnabled, setGeneralPoolEnabled] = useState(true);
  const [bufferEnabled, setBufferEnabled] = useState(true);
  const [tipPercentage, setTipPercentage] = useState('20');
  const [gasHoldAmount, setGasHoldAmount] = useState('125');
  const [cnpApprovalThreshold, setCnpApprovalThreshold] = useState('50');
  const [largeAmountThreshold, setLargeAmountThreshold] = useState('500');
  
  // Notification settings
  const [notifyTransactions, setNotifyTransactions] = useState(true);
  const [notifyLowBalance, setNotifyLowBalance] = useState(true);
  const [notifyDeclined, setNotifyDeclined] = useState(true);
  const [notifyRules, setNotifyRules] = useState(false);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  // Virtual cards data
  const virtualCards = [
    { 
      name: 'Groceries Card', 
      last4: '4521', 
      linkedEnvelopeId: 'groceries', 
      walletStatus: 'provisioned' as const,
      frozen: false
    },
    { 
      name: 'Dining Card', 
      last4: '8834', 
      linkedEnvelopeId: 'dining', 
      walletStatus: 'not_provisioned' as const,
      frozen: false
    },
    { 
      name: 'Gas Card', 
      last4: '2157', 
      linkedEnvelopeId: 'gas', 
      walletStatus: 'provisioned' as const,
      frozen: true
    },
  ];


  const handleCardAction = (cardName: string, action: 'freeze' | 'unfreeze' | 'replace') => {
    console.log(`${action} card: ${cardName}`);
    // Handle card management actions
  };

  return (
    <div 
      className={cn('p-4 space-y-6', className)}
      data-endpoint="GET /user/settings"
    >
      {/* Profile Section */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)] flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </h2>
        
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)]">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body font-medium text-[var(--color-neutral-900)]">
                  John Doe
                </p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  john.doe@email.com
                </p>
              </div>
              <Button variant="ghost" size="sm" className="touch-target">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="pt-3 border-t border-[var(--color-neutral-200)]">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-caption text-[var(--color-neutral-500)]">Member Since</p>
                  <p className="text-body font-medium text-[var(--color-neutral-900)]">Jan 2025</p>
                </div>
                <div>
                  <p className="text-caption text-[var(--color-neutral-500)]">Total Envelopes</p>
                  <p className="text-body font-medium text-[var(--color-neutral-900)]">6</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spend Modes & Fallbacks */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)] flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Default Spend Mode
        </h2>
        
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)] p-4 space-y-4">
          <div className="space-y-2">
            <Label>Default Mode for New Transactions</Label>
            <Select
              value={defaultSpendMode}
              onValueChange={(v: string) => setDefaultSpendMode(v as SpendMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMART_AUTO">Smart Auto</SelectItem>
                <SelectItem value="LOCKED">Locked Mode</SelectItem>
                <SelectItem value="GENERAL_POOL">General Pool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-3 border-t border-[var(--color-neutral-200)]">
            <h3 className="text-body font-medium text-[var(--color-neutral-900)]">Fallback Chain</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">General Pool Fallback</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  Use when specific envelope routing fails
                </p>
              </div>
              <Switch 
                checked={generalPoolEnabled} 
                onCheckedChange={setGeneralPoolEnabled}
                data-action="toggle:general_pool"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">Buffer Envelope</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  Last resort before declining
                </p>
              </div>
              <Switch 
                checked={bufferEnabled} 
                onCheckedChange={setBufferEnabled}
                data-action="toggle:buffer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buffer Settings */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)] flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Buffer Settings
        </h2>
        
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)] p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tip-percentage" className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Restaurant Tip %
              </Label>
              <div className="relative">
                <Input
                  id="tip-percentage"
                  type="text"
                  value={tipPercentage}
                  onChange={(e) => setTipPercentage(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-neutral-500)] text-caption">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gas-hold" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Gas Hold Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-neutral-500)]">
                  $
                </span>
                <Input
                  id="gas-hold"
                  type="text"
                  value={gasHoldAmount}
                  onChange={(e) => setGasHoldAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--color-neutral-500)] bg-[var(--color-neutral-50)] rounded-[var(--radius-sm)] p-3">
            <p><strong>Tip percentage:</strong> Auto-calculate tips for restaurants (MCC 5812, 5814)</p>
            <p><strong>Gas hold:</strong> Pre-authorization amount for gas stations</p>
          </div>
        </div>
      </div>

      {/* Approval Settings */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)] flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security & Approvals
        </h2>
        
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)] p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnp-threshold">Card-Not-Present Approval</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-neutral-500)]">
                  $
                </span>
                <Input
                  id="cnp-threshold"
                  type="text"
                  value={cnpApprovalThreshold}
                  onChange={(e) => setCnpApprovalThreshold(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="large-amount">Large Amount Approval</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-neutral-500)]">
                  $
                </span>
                <Input
                  id="large-amount"
                  type="text"
                  value={largeAmountThreshold}
                  onChange={(e) => setLargeAmountThreshold(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--color-neutral-500)] bg-[var(--color-info)]/10 rounded-[var(--radius-sm)] p-3 border border-[var(--color-info)]/20">
            <p>Transactions above these amounts will require push notification approval</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)] flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)] p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">Transaction Alerts</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  Notify on all transactions
                </p>
              </div>
              <Switch 
                checked={notifyTransactions} 
                onCheckedChange={setNotifyTransactions}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">Low Balance Alerts</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  When envelopes are running low
                </p>
              </div>
              <Switch 
                checked={notifyLowBalance} 
                onCheckedChange={setNotifyLowBalance}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">Declined Transactions</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  When transactions are declined
                </p>
              </div>
              <Switch 
                checked={notifyDeclined} 
                onCheckedChange={setNotifyDeclined}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">Rule Updates</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  When new rules are created
                </p>
              </div>
              <Switch 
                checked={notifyRules} 
                onCheckedChange={setNotifyRules}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-[var(--color-neutral-900)]">Weekly Digest</p>
                <p className="text-caption text-[var(--color-neutral-500)]">
                  Summary of spending by category
                </p>
              </div>
              <Switch 
                checked={notifyWeeklyDigest} 
                onCheckedChange={setNotifyWeeklyDigest}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Card Management */}
      <div className="space-y-4">
        <h2 className="text-h2 text-[var(--color-neutral-900)] flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Virtual Cards
        </h2>
        
        <div className="space-y-3">
          {virtualCards.map((card) => (
            <div 
              key={card.last4}
              className="bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)]"
            >
              <CardTokenRow
                name={card.name}
                last4={card.last4}
                linkedEnvelopeId={card.linkedEnvelopeId}
                walletStatus={card.walletStatus}
                type="virtual"
                className="!border-0 !shadow-none !bg-transparent"
              />
              
              {/* Card Actions */}
              <div className="px-4 pb-4 border-t border-[var(--color-neutral-200)]">
                <div className="flex items-center gap-2 mt-3">
                  {card.frozen ? (
                    <Badge className="bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20">
                      <Lock className="h-3 w-3 mr-1" />
                      Frozen
                    </Badge>
                  ) : (
                    <Badge className="bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20">
                      Active
                    </Badge>
                  )}
                  
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCardAction(card.name, card.frozen ? 'unfreeze' : 'freeze')}
                      className="text-xs h-auto py-1 px-2"
                    >
                      {card.frozen ? 'Unfreeze' : 'Freeze'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCardAction(card.name, 'replace')}
                      className="text-xs h-auto py-1 px-2 text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Replace
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Notes */}
      <div className="fixed bottom-20 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded-[var(--radius-sm)] text-xs max-w-xs opacity-75 pointer-events-none z-50">
        <strong>Dev Notes:</strong><br />
        • Local state in MVP<br />
        • Later: persist to user profile<br />
        • Card management via BaaS APIs<br />
        • Push notification setup
      </div>
    </div>
  );
};

export { SettingsScreen };
export type { SettingsScreenProps };