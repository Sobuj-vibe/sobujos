import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRAYERS, isoDate, usePrayerLogs } from '@/hooks/usePrayer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function KazaSection() {
  const { t } = useTranslation();
  const { logs, markMadeUp } = usePrayerLogs(90);
  const [openDay, setOpenDay] = useState<string | null>(null);

  // 90-day grid (most recent first, displayed oldest -> newest)
  const days = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(isoDate(d));
    }
    return arr;
  }, []);

  const kazaByDate = useMemo(() => {
    const m: Record<string, typeof logs> = {};
    logs.forEach((l) => {
      if (l.status === 'qaza' && !l.made_up_at) {
        (m[l.date] = m[l.date] || []).push(l);
      }
    });
    return m;
  }, [logs]);

  const totalKaza = logs.filter((l) => l.status === 'qaza' && !l.made_up_at).length;
  const perPrayer = PRAYERS.map((p) => ({
    p,
    n: logs.filter((l) => l.prayer === p && l.status === 'qaza' && !l.made_up_at).length,
  }));

  const intensity = (n: number) =>
    n === 0 ? 'bg-muted/40' :
    n === 1 ? 'bg-rose-500/30' :
    n === 2 ? 'bg-rose-500/55' :
    n === 3 ? 'bg-rose-500/75' : 'bg-rose-500';

  const openLogs = openDay ? kazaByDate[openDay] || [] : [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{t('prayer.kazaTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('prayer.kazaSub')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('prayer.kazaTotal')}</p>
            <p className="text-2xl font-bold">{totalKaza}</p>
          </div>
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto py-1">
          {days.map((d) => {
            const n = (kazaByDate[d] || []).length;
            return (
              <button
                key={d}
                onClick={() => setOpenDay(d === openDay ? null : d)}
                className={cn(
                  'h-3.5 w-3.5 rounded-sm transition',
                  intensity(n),
                  openDay === d && 'ring-2 ring-primary',
                )}
                title={`${d} · ${n}`}
                aria-label={`${d} ${n}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
          <span>{t('prayer.legend.less')}</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-muted/40" />
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/30" />
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/55" />
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/75" />
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
          <span>{t('prayer.legend.more')}</span>
        </div>

        {openDay && (
          <div className="mt-3 border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium">{openDay}</p>
            {openLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('prayer.noKaza')}</p>
            ) : (
              openLogs.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{t(`prayer.${l.prayer}`)}</span>
                  <Button size="sm" variant="outline" onClick={() => markMadeUp(l.id)}>
                    {t('prayer.markMadeUp')}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <div className="grid grid-cols-5 gap-2">
          {perPrayer.map(({ p, n }) => (
            <div key={p} className="rounded-lg bg-muted/40 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{t(`prayer.${p}`)}</p>
              <p className="text-lg font-bold">{n}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}