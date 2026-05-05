import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/app/AppBar';
import { HadithCard } from '@/components/prayer/HadithCard';
import { DailyPrayerTracker } from '@/components/prayer/DailyPrayerTracker';
import { PrayerReport } from '@/components/prayer/PrayerReport';
import { KazaSection } from '@/components/prayer/KazaSection';
import { QuranSection } from '@/components/prayer/QuranSection';
import { TasbihCard } from '@/components/prayer/TasbihCard';
import { isoDate, PRAYERS, usePrayerLogs } from '@/hooks/usePrayer';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

type Tab = 'today' | 'kaza' | 'quran' | 'reports';

function StreakCard() {
  const { t } = useTranslation();
  const { logs } = usePrayerLogs(90);
  const streak = useMemo(() => {
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const date = isoDate(d);
      const dayLogs = logs.filter((l) => l.date === date);
      const completed = PRAYERS.every((p) =>
        dayLogs.some((l) => l.prayer === p && (l.status === 'on_time' || l.status === 'late')),
      );
      if (completed) s++;
      else if (i > 0) break;
      else break;
    }
    return s;
  }, [logs]);

  return (
    <div className="rounded-2xl gradient-primary p-4 text-primary-foreground flex items-center gap-3 shadow-soft">
      <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
        <Flame className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs opacity-90">{t('prayer.streak')}</p>
        <p className="text-2xl font-bold leading-tight">{streak}</p>
      </div>
    </div>
  );
}

export default function Prayer() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('today');
  const tabs: Tab[] = ['today', 'kaza', 'quran', 'reports'];

  return (
    <div>
      <AppBar title={t('prayer.title')} />
      <div className="pt-appbar md:pt-0 px-4 md:px-0 pb-6 space-y-3">
        <HadithCard />

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
              {t(`prayer.subtabs.${tt}`)}
            </button>
          ))}
        </div>

        {tab === 'today' && (
          <div className="space-y-3">
            <StreakCard />
            <DailyPrayerTracker />
            <TasbihCard />
          </div>
        )}
        {tab === 'kaza' && <KazaSection />}
        {tab === 'quran' && <QuranSection />}
        {tab === 'reports' && <PrayerReport />}
      </div>
    </div>
  );
}