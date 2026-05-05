import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PRAYERS, isoDate, usePrayerLogs } from '@/hooks/usePrayer';

export function PrayerReport() {
  const { t } = useTranslation();
  const { logs } = usePrayerLogs(30);

  const stats = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);
    const days: string[] = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) days.push(isoDate(new Date(d)));
    const total = days.length;

    return PRAYERS.map((p) => {
      const onTime = logs.filter((l) => l.prayer === p && l.status === 'on_time').length;
      const late = logs.filter((l) => l.prayer === p && l.status === 'late').length;
      const qaza = logs.filter((l) => l.prayer === p && l.status === 'qaza' && !l.made_up_at).length;
      const pct = Math.round(((onTime + late) / total) * 100);
      return { p, onTime, late, qaza, pct, total };
    });
  }, [logs]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">{t('prayer.reportTitle')}</h3>
      <div className="space-y-3">
        {stats.map(({ p, pct, onTime, late, qaza }) => (
          <div key={p}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{t(`prayer.${p}`)}</span>
              <span className="text-muted-foreground">
                {pct}% · ✓{onTime} ⏱{late} ✗{qaza}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div className="bg-emerald-500" style={{ width: `${(onTime / 30) * 100}%` }} />
              <div className="bg-amber-500" style={{ width: `${(late / 30) * 100}%` }} />
              <div className="bg-rose-500" style={{ width: `${(qaza / 30) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}