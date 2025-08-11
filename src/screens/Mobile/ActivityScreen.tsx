import React, { useState } from 'react';
import { cn } from '../../components/ui/utils';
import { TxnListItem } from '../../components/domain/TxnListItem';
import { DecisionBanner } from '../../components/domain/DecisionBanner';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Filter } from 'lucide-react';

interface ActivityScreenProps {
  className?: string;
  onTransactionClick?: (transactionId: string) => void;
  showDecisionBanner?: boolean;
  onUndoLastTransaction?: () => void;
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({
  className,
  onTransactionClick,
  showDecisionBanner = false,
  onUndoLastTransaction
}) => {
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [selectedEnvelope, setSelectedEnvelope] = useState('all');
  const [selectedMerchant, setSelectedMerchant] = useState('all');

  // Sample transaction data
  const transactions = [
    {
      id: '1',
      merchant: 'CHIPOTLE',
      amount: 14.82,
      tip: 2.40,
      envelope: 'Dining',
      status: 'settled' as const,
      reasons: ['mcc' as const, 'user_active' as const],
      mccCode: '5814',
      date: new Date(2025, 7, 8, 12, 30)
    },
    {
      id: '2',
      merchant: 'SHELL 123',
      amount: 68.10,
      envelope: 'Gas',
      status: 'settled' as const,
      isPreauth: true,
      reasons: ['mcc' as const, 'geofence' as const],
      mccCode: '5542',
      date: new Date(2025, 7, 8, 8, 15)
    },
    {
      id: '3',
      merchant: 'KROGER #842',
      amount: 127.45,
      envelope: 'Groceries',
      status: 'captured' as const,
      reasons: ['mcc' as const, 'geofence' as const],
      mccCode: '5411',
      date: new Date(2025, 7, 7, 16, 45)
    },
    {
      id: '4',
      merchant: 'WALMART SUPERCENTER',
      amount: 89.23,
      envelope: 'Groceries',
      status: 'settled' as const,
      reasons: ['mcc' as const],
      mccCode: '5311',
      date: new Date(2025, 7, 7, 10, 20)
    },
    {
      id: '5',
      merchant: 'AMAZON.COM',
      amount: 45.67,
      envelope: 'Misc',
      status: 'settled' as const,
      reasons: ['fallback_general_pool' as const],
      mccCode: '5969',
      date: new Date(2025, 7, 6, 14, 10)
    }
  ];

  const envelopes = ['All', 'Groceries', 'Dining', 'Gas', 'Bills', 'Buffer', 'Misc'];
  const merchants = ['All', ...Array.from(new Set(transactions.map(t => t.merchant)))];

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedEnvelope !== 'all' && transaction.envelope.toLowerCase() !== selectedEnvelope.toLowerCase()) {
      return false;
    }
    if (selectedMerchant !== 'all' && transaction.merchant !== selectedMerchant) {
      return false;
    }
    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const dateKey = transaction.date.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
    return groups;
  }, {} as Record<string, typeof transactions>);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  return (
    <div 
      className={cn('p-4 space-y-6', className)}
      data-endpoint="GET /transactions"
    >
      {/* Decision Banner */}
      {showDecisionBanner && (
        <DecisionBanner
          variant="success"
          message="Used"
          envelope="Groceries envelope"
          onUndo={onUndoLastTransaction}
          onDismiss={() => {/* dismiss handler */}}
          data-transaction-id="latest"
          data-endpoint="POST /transactions/undo"
          data-action="undo:transaction"
        />
      )}

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-[var(--color-neutral-900)]">Activity</h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="touch-target"
            data-action="open:FilterSheet"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-caption text-[var(--color-neutral-600)]">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="text-caption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">This Month</SelectItem>
                <SelectItem value="last">Last Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-caption text-[var(--color-neutral-600)]">Envelope</label>
            <Select value={selectedEnvelope} onValueChange={setSelectedEnvelope}>
              <SelectTrigger className="text-caption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {envelopes.map((envelope) => (
                  <SelectItem key={envelope.toLowerCase()} value={envelope.toLowerCase()}>
                    {envelope}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-caption text-[var(--color-neutral-600)]">Merchant</label>
            <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
              <SelectTrigger className="text-caption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((merchant) => (
                  <SelectItem key={merchant} value={merchant}>
                    {merchant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transaction Groups */}
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([dateString, dayTransactions]) => (
          <div key={dateString} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-body font-medium text-[var(--color-neutral-700)]">
                {formatDateHeader(dateString)}
              </h3>
              <p className="text-caption text-[var(--color-neutral-500)]">
                {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Transactions for this date */}
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <TxnListItem
                  key={transaction.id}
                  merchant={transaction.merchant}
                  amount={transaction.amount}
                  envelope={transaction.envelope}
                  status={transaction.status}
                  tip={transaction.tip}
                  isPreauth={transaction.isPreauth}
                  reasons={transaction.reasons}
                  mccCode={transaction.mccCode}
                  date={transaction.date}
                  onClick={() => onTransactionClick?.(transaction.id)}
                  data-transaction-id={transaction.id}
                  data-action="navigate:TransactionDetailsScreen"
                />
              ))}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-body text-[var(--color-neutral-500)]">
              No transactions found for the selected filters
            </p>
          </div>
        )}
      </div>

      {/* Developer Notes */}
      <div className="fixed bottom-20 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded-[var(--radius-sm)] text-xs max-w-xs opacity-75 pointer-events-none z-50">
        <strong>Dev Notes:</strong><br />
        • For MVP: poll GET /balances<br />
        • Later: SSE GET /events for real-time<br />
        • Filters: month, envelope, merchant<br />
        • DecisionBanner: 10s auto-dismiss
      </div>
    </div>
  );
};

export { ActivityScreen };
export type { ActivityScreenProps };