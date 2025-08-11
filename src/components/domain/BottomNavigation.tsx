import React from 'react';
import { cn } from '../ui/utils';
import { Home, CreditCard, Zap, Activity, Settings } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'home' | 'card' | 'rules' | 'activity' | 'settings';
  onTabChange: (tab: 'home' | 'card' | 'rules' | 'activity' | 'settings') => void;
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  className
}) => {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'card' as const, label: 'Card', icon: CreditCard },
    { id: 'rules' as const, label: 'Rules', icon: Zap },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={cn(
      'flex items-center justify-around px-2 py-3 bg-white border-t border-[var(--color-neutral-200)]',
      'safe-area-inset-bottom', // For iOS safe area
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-[var(--radius-sm)] transition-all duration-200',
              'touch-target min-w-[60px]',
              isActive 
                ? 'text-[var(--color-brand-primary)]' 
                : 'text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]'
            )}
            aria-label={tab.label}
          >
            <Icon className={cn(
              'h-5 w-5 transition-colors duration-200',
              isActive && 'text-[var(--color-brand-primary)]'
            )} />
            <span className={cn(
              'text-caption transition-colors duration-200',
              isActive 
                ? 'text-[var(--color-brand-primary)] font-medium' 
                : 'text-[var(--color-neutral-500)]'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export { BottomNavigation };
export type { BottomNavigationProps };