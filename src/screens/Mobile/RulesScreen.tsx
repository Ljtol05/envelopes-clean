import React, { useState } from 'react';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, GripVertical, ArrowRight, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
  id: string;
  priority: number;
  predicate: {
    type: 'mcc' | 'merchant_name' | 'merchant_id' | 'geofence' | 'time' | 'card_token';
    value: string;
    operator?: 'equals' | 'contains' | 'starts_with';
  };
  action: {
    type: 'route_to_envelope';
    envelope_id: string;
    envelope_name: string;
  };
  enabled: boolean;
  created_at: string;
}

interface RulesScreenProps {
  className?: string;
  rules?: Rule[];
  envelopes?: Array<{ id: string; name: string }>;
  onUpdateRule?: (ruleId: string, updates: Partial<Rule>) => void;
  onCreateRule?: (rule: Omit<Rule, 'id' | 'priority' | 'created_at'>) => void;
  onDeleteRule?: (ruleId: string) => void;
  onReorderRules?: (ruleIds: string[]) => void;
  isLoading?: boolean;
}

const RulesScreen: React.FC<RulesScreenProps> = ({
  className,
  rules,
  envelopes,
  onUpdateRule,
  onCreateRule,
  isLoading = false
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    predicate: { type: 'mcc', value: '' },
    action: { type: 'route_to_envelope', envelope_id: '', envelope_name: '' },
    enabled: true
  });

  // Sample data
  const sampleRules: Rule[] = rules || [
    {
      id: 'rule_1',
      priority: 1,
      predicate: { type: 'mcc', value: '5411' },
      action: { type: 'route_to_envelope', envelope_id: 'groceries', envelope_name: 'Groceries' },
      enabled: true,
      created_at: '2025-01-08T10:00:00Z'
    },
    {
      id: 'rule_2', 
      priority: 2,
      predicate: { type: 'merchant_name', value: 'KROGER #842', operator: 'equals' },
      action: { type: 'route_to_envelope', envelope_id: 'groceries', envelope_name: 'Groceries' },
      enabled: true,
      created_at: '2025-01-07T15:30:00Z'
    },
    {
      id: 'rule_3',
      priority: 3,
      predicate: { type: 'card_token', value: 'bills_card' },
      action: { type: 'route_to_envelope', envelope_id: 'bills', envelope_name: 'Bills' },
      enabled: false,
      created_at: '2025-01-06T09:15:00Z'
    }
  ];

  const sampleEnvelopes = envelopes || [
    { id: 'groceries', name: 'Groceries' },
    { id: 'dining', name: 'Dining' },
    { id: 'gas', name: 'Gas' },
    { id: 'bills', name: 'Bills' },
    { id: 'buffer', name: 'Buffer' },
    { id: 'misc', name: 'Misc' }
  ];

  const formatPredicate = (predicate: Rule['predicate']) => {
    switch (predicate.type) {
      case 'mcc':
        return `MCC = ${predicate.value}`;
      case 'merchant_name':
        return `Merchant ${predicate.operator || 'equals'} "${predicate.value}"`;
      case 'merchant_id':
        return `Merchant ID = ${predicate.value}`;
      case 'geofence':
        return `Location = ${predicate.value}`;
      case 'time':
        return `Time ${predicate.value}`;
      case 'card_token':
        return `Card = ${predicate.value}`;
      default:
        return predicate.value;
    }
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    onUpdateRule?.(ruleId, { enabled });
    toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleCreateRule = () => {
    if (!newRule.predicate?.value || !newRule.action?.envelope_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedEnvelope = sampleEnvelopes.find(env => env.id === newRule.action?.envelope_id);
    if (!selectedEnvelope) return;

    const ruleToCreate = {
      ...newRule,
      action: {
        type: 'route_to_envelope' as const,
        envelope_id: selectedEnvelope.id,
        envelope_name: selectedEnvelope.name
      }
    } as Omit<Rule, 'id' | 'priority' | 'created_at'>;

    onCreateRule?.(ruleToCreate);
    setIsCreating(false);
    setNewRule({
      predicate: { type: 'mcc', value: '' },
      action: { type: 'route_to_envelope', envelope_id: '', envelope_name: '' },
      enabled: true
    });
    toast.success('Rule created successfully');
  };

  const suggestions = [
    { merchant: 'WALMART SUPERCENTER', envelope: 'Groceries', mcc: '5311' },
    { merchant: 'SHELL 123', envelope: 'Gas', mcc: '5542' },
    { merchant: 'CHIPOTLE', envelope: 'Dining', mcc: '5814' }
  ];

  if (isLoading) {
    return (
      <div className={cn('p-4 space-y-4', className)}>
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-[var(--color-neutral-100)] rounded-[var(--radius-md)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn('p-4 space-y-6', className)}
      data-endpoint="GET /rules"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--color-neutral-900)]">Routing Rules</h1>
          <p className="text-caption text-[var(--color-neutral-500)] mt-1">
            Higher priority rules are applied first
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          data-action="open:RuleBuilder"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {sampleRules.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-[var(--color-neutral-200)] rounded-[var(--radius-md)]">
            <p className="text-body text-[var(--color-neutral-500)] mb-4">
              No rules created yet
            </p>
            <Button onClick={() => setIsCreating(true)}>
              Create Your First Rule
            </Button>
          </div>
        ) : (
          sampleRules.map((rule, index) => (
            <div
              key={rule.id}
              className={cn(
                'flex items-center gap-3 p-4 bg-white rounded-[var(--radius-md)]',
                'border border-[var(--color-neutral-200)] shadow-[var(--shadow-card)]',
                'hover:border-[var(--color-neutral-300)] transition-colors duration-200'
              )}
              data-rule-id={rule.id}
            >
              {/* Drag Handle & Priority */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  aria-label="Reorder rule"
                  title="Reorder rule"
                  className="touch-target p-1 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]"
                  data-action="drag:reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <Badge variant="secondary" className="text-xs font-mono min-w-[24px] justify-center">
                  {index + 1}
                </Badge>
              </div>

              {/* Rule Logic */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 text-body">
                  <span className="font-medium text-[var(--color-neutral-700)]">IF</span>
                  <Badge variant="outline" className="text-xs">
                    {formatPredicate(rule.predicate)}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-[var(--color-neutral-400)]" />
                  <Badge className="text-xs bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                    {rule.action.envelope_name}
                  </Badge>
                </div>
                
                {rule.predicate.type === 'mcc' && (
                  <p className="text-caption text-[var(--color-neutral-500)]">
                    Merchant Category: {rule.predicate.value === '5411' ? 'Grocery Stores' :
                                        rule.predicate.value === '5814' ? 'Fast Food' :
                                        rule.predicate.value === '5542' ? 'Gas Stations' : 'Other'}
                  </p>
                )}
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(enabled: boolean) => handleToggleRule(rule.id, enabled)}
                  data-action="toggle:enabled"
                />
                <span className="text-caption text-[var(--color-neutral-500)]">
                  {rule.enabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[var(--color-warning)]" />
            <h3 className="text-h2 text-[var(--color-neutral-900)]">Suggested Rules</h3>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-[var(--radius-sm)]"
              >
                <div className="text-caption text-[var(--color-neutral-700)]">
                  <strong>{suggestion.merchant}</strong> ➜ {suggestion.envelope}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--color-brand-primary)] text-caption"
                  onClick={() => {
                    // Pre-fill rule builder
                    setNewRule({
                      predicate: { type: 'merchant_name', value: suggestion.merchant, operator: 'equals' },
                      action: { 
                        type: 'route_to_envelope', 
                        envelope_id: suggestion.envelope.toLowerCase(), 
                        envelope_name: suggestion.envelope 
                      },
                      enabled: true
                    });
                    setIsCreating(true);
                  }}
                  data-action="apply:suggestion"
                >
                  Add Rule
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-lg" data-endpoint="POST /rules">
          <DialogHeader>
            <DialogTitle>Create New Rule</DialogTitle>
            <DialogDescription className="text-caption text-[var(--color-neutral-500)]">
              Create a custom routing rule to automatically direct transactions to specific envelopes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Predicate Type */}
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select 
                value={newRule.predicate?.type} 
                onValueChange={(type: Rule['predicate']['type']) => 
                  setNewRule(prev => ({ ...prev, predicate: { ...prev.predicate!, type, value: '' } }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcc">Merchant Category (MCC)</SelectItem>
                  <SelectItem value="merchant_name">Merchant Name</SelectItem>
                  <SelectItem value="geofence">Location</SelectItem>
                  <SelectItem value="card_token">Specific Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Predicate Value */}
            <div className="space-y-2">
              <Label>
                {newRule.predicate?.type === 'mcc' ? 'MCC Code' :
                 newRule.predicate?.type === 'merchant_name' ? 'Merchant Name' :
                 newRule.predicate?.type === 'geofence' ? 'Location Name' :
                 newRule.predicate?.type === 'card_token' ? 'Card Name' : 'Value'}
              </Label>
              <Input
                placeholder={
                  newRule.predicate?.type === 'mcc' ? '5411' :
                  newRule.predicate?.type === 'merchant_name' ? 'KROGER #842' :
                  newRule.predicate?.type === 'geofence' ? 'Home Depot Store' :
                  'Enter value...'
                }
                value={newRule.predicate?.value || ''}
                onChange={(e) => setNewRule(prev => ({ 
                  ...prev, 
                  predicate: { ...prev.predicate!, value: e.target.value } 
                }))}
              />
            </div>

            {/* Target Envelope */}
            <div className="space-y-2">
              <Label>Route to Envelope</Label>
              <Select
                value={newRule.action?.envelope_id}
                onValueChange={(envelopeId: string) => {
                  const envelope = sampleEnvelopes.find(env => env.id === envelopeId);
                  if (envelope) {
                    setNewRule(prev => ({
                      ...prev,
                      action: {
                        type: 'route_to_envelope',
                        envelope_id: envelope.id,
                        envelope_name: envelope.name
                      }
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select envelope" />
                </SelectTrigger>
                <SelectContent>
                  {sampleEnvelopes.map((envelope) => (
                    <SelectItem key={envelope.id} value={envelope.id}>
                      {envelope.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCreating(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateRule} className="flex-1" data-action="create:rule">
              Create Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Developer Notes */}
      <div className="fixed bottom-20 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded-[var(--radius-sm)] text-xs max-w-xs opacity-75 pointer-events-none z-50">
        <strong>Dev Notes:</strong><br />
        • GET /rules on mount<br />
        • POST /rules for create/update<br />
        • Drag handle updates priority<br />
        • Switch toggles enabled state
      </div>
    </div>
  );
};

export { RulesScreen };
export type { RulesScreenProps, Rule };