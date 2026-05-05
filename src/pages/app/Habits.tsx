import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/app/AppBar';
import { TodayView } from '@/components/habits/TodayView';
import { HabitsList } from '@/components/habits/HabitsList';
import { GoalsList } from '@/components/habits/GoalsList';
import { StatsView } from '@/components/habits/StatsView';
import { cn } from '@/lib/utils';

type Tab = 'today' | 'habits' | 'goals' | 'stats';

export default function Habits() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('today');
  const tabs: Tab[] = ['today', 'habits', 'goals', 'stats'];

  return (
    <div>
      <AppBar title={t('habits.title')} />
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
              {t(`habits.subtabs.${tt}`)}
            </button>
          ))}
        </div>
        {tab === 'today' && <TodayView />}
        {tab === 'habits' && <HabitsList />}
        {tab === 'goals' && <GoalsList />}
        {tab === 'stats' && <StatsView />}
      </div>
    </div>
  );
}