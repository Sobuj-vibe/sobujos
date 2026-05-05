import { useTranslation } from 'react-i18next';
import { Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRAYERS, PrayerName, PrayerStatus, usePrayerLogs } from '@/hooks/usePrayer';
import { useTimezone } from '@/contexts/TimezoneContext';
import { todayInTz } from '@/lib/datetime';

const STATUSES: { id: PrayerStatus; icon: any; cls: string }[] = [
  { id: 'on_time', icon: Check, cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  { id: 'late', icon: Clock, cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  { id: 'qaza', icon: X, cls: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
];

export function DailyPrayerTracker() {
  const { t } = useTranslation();
  const { logs, upsertPrayer } = usePrayerLogs(7);
  const { timezone } = useTimezone();
  const today = todayInTz(timezone);
  const todayLogs = logs.filter((l) => l.date === today);
  const byPrayer: Record<string, PrayerStatus | undefined> = {};
  todayLogs.forEach((l) => (byPrayer[l.prayer] = l.status));

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{t('prayer.todayTitle')}</h3>
        <span className="text-xs text-muted-foreground">
          {todayLogs.filter((l) => l.status === 'on_time' || l.status === 'late').length}/5
        </span>
      </div>
      <div className="space-y-2">
        {PRAYERS.map((p) => {
          const current = byPrayer[p];
          return (
            <div key={p} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-sm font-medium">{t(`prayer.${p}` as PrayerName)}</span>
              <div className="flex gap-1.5">
                {STATUSES.map(({ id, icon: Icon, cls }) => (
                  <button
                    key={id}
                    onClick={() => upsertPrayer(today, p, id)}
                    className={cn(
                      'h-8 px-2.5 rounded-full border text-xs flex items-center gap-1 tap transition',
                      current === id ? cls : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted',
                    )}
                    aria-label={t(`prayer.status.${id}`)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t(`prayer.status.${id}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}