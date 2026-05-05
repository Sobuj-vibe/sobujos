import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/app/AppBar';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { TransactionList } from '@/components/finance/TransactionList';
import { LoansSection } from '@/components/finance/LoansSection';
import { RecurringSection } from '@/components/finance/RecurringSection';
import { FinanceSettings } from '@/components/finance/FinanceSettings';
import { cn } from '@/lib/utils';

type Tab = 'dashboard' | 'income' | 'expense' | 'loans' | 'recurring' | 'settings';

export default function Finance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('dashboard');
  const tabs: Tab[] = ['dashboard', 'income', 'expense', 'loans', 'recurring', 'settings'];

  return (
    <div>
      <AppBar title={t('finance.title')} />
      <div className="pt-appbar md:pt-0 px-4 md:px-0 pb-6 space-y-3">
        <div className="flex gap-1.5 p-1 rounded-full bg-muted overflow-x-auto">
          {tabs.map((tt) => (
            <button
              key={tt}
              onClick={() => setTab(tt)}
              className={cn(
                'flex-1 min-w-fit px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap transition',
                tab === tt ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(`finance.subtabs.${tt}`)}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <FinanceDashboard />}
        {tab === 'income' && <TransactionList kind="income" />}
        {tab === 'expense' && <TransactionList kind="expense" />}
        {tab === 'loans' && <LoansSection />}
        {tab === 'recurring' && <RecurringSection />}
        {tab === 'settings' && <FinanceSettings />}
      </div>
    </div>
  );
}