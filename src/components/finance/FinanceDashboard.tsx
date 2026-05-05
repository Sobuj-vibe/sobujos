import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, Wallet, Repeat, HandCoins, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  useTransactions, useFinanceCategories, useFinanceSettings, useLoans, useRecurring,
  convertCurrency,
} from '@/hooks/useFinance';
import { CurrencyAmount, formatMoney } from './CurrencyAmount';
import { QuickAdd } from './QuickAdd';
import { Currency } from '@/data/financeDefaults';

function daysUntil(date: string) {
  const d = new Date(date);
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function FinanceDashboard() {
  const { t } = useTranslation();
  const { items: tx } = useTransactions({ daysBack: 30 });
  const { categories } = useFinanceCategories();
  const { settings } = useFinanceSettings();
  const { items: loans } = useLoans();
  const { items: recurring } = useRecurring();

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const totals = useMemo(() => {
    const inc = tx.filter((t) => t.kind === 'income');
    const exp = tx.filter((t) => t.kind === 'expense');
    const sumIn = inc.reduce((s, t) => s + convertCurrency(t.amount, t.currency, settings.primary_currency, settings), 0);
    const sumOut = exp.reduce((s, t) => s + convertCurrency(t.amount, t.currency, settings.primary_currency, settings), 0);
    const sadaqah = exp
      .filter((t) => {
        const c = t.category_id ? catMap[t.category_id] : null;
        return c?.name?.toLowerCase().includes('charity') || c?.name?.toLowerCase().includes('sadaqah');
      })
      .reduce((s, t) => s + convertCurrency(t.amount, t.currency, settings.primary_currency, settings), 0);
    return { sumIn, sumOut, net: sumIn - sumOut, sadaqah };
  }, [tx, settings, catMap]);

  const topCats = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tx.filter((x) => x.kind === 'expense')) {
      const id = t.category_id || 'uncat';
      map.set(id, (map.get(id) || 0) + convertCurrency(t.amount, t.currency, settings.primary_currency, settings));
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amt]) => ({ id, name: catMap[id]?.name || 'Other', icon: catMap[id]?.icon || 'Tag', amt }));
  }, [tx, settings, catMap]);

  const topMax = topCats[0]?.amt || 1;

  const upcoming = useMemo(
    () => recurring.filter((r) => {
      const d = daysUntil(r.next_renewal_date);
      return d >= 0 && d <= 7;
    }).slice(0, 5),
    [recurring],
  );

  const outstanding = useMemo(() => {
    const open = loans.filter((l) => !l.paid_at);
    const sum = (dir: 'taken' | 'given') => {
      const map: Partial<Record<Currency, number>> = {};
      for (const l of open.filter((x) => x.direction === dir)) {
        map[l.currency] = (map[l.currency] || 0) + l.amount;
      }
      return map;
    };
    return { taken: sum('taken'), given: sum('given') };
  }, [loans]);

  const recent = tx.slice(0, 5);

  return (
    <div className="space-y-3">
      <QuickAdd />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-card border border-border p-3 shadow-soft">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowDownRight className="h-3 w-3 text-[hsl(var(--success))]" />
            {t('finance.summaryIn')}
          </div>
          <p className="mt-1 text-base font-semibold tabular-nums text-[hsl(var(--success))]">
            {formatMoney(totals.sumIn, settings.primary_currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3 shadow-soft">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpRight className="h-3 w-3 text-destructive" />
            {t('finance.summaryOut')}
          </div>
          <p className="mt-1 text-base font-semibold tabular-nums text-destructive">
            {formatMoney(totals.sumOut, settings.primary_currency)}
          </p>
        </div>
        <div className="rounded-2xl gradient-primary p-3 text-primary-foreground shadow-soft">
          <div className="flex items-center gap-1 text-xs opacity-90">
            <Wallet className="h-3 w-3" />{t('finance.summaryNet')}
          </div>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {formatMoney(totals.net, settings.primary_currency)}
          </p>
        </div>
      </div>

      {/* Top expense categories */}
      {topCats.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
          <h3 className="text-sm font-semibold mb-3">{t('finance.topCategories')}</h3>
          <div className="space-y-2.5">
            {topCats.map((c) => {
              const Icon = (Icons as any)[c.icon] || Icons.Tag;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-primary" />{c.name}</span>
                    <span className="tabular-nums font-medium">{formatMoney(c.amt, settings.primary_currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: `${(c.amt / topMax) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outstanding loans */}
      {(Object.keys(outstanding.taken).length > 0 || Object.keys(outstanding.given).length > 0) && (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><HandCoins className="h-4 w-4" />{t('finance.outstandingLoans')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <p className="text-xs text-muted-foreground">{t('finance.taken')}</p>
              {Object.entries(outstanding.taken).map(([cur, amt]) => (
                <p key={cur} className="text-sm font-semibold tabular-nums">{cur} {amt!.toLocaleString()}</p>
              ))}
              {Object.keys(outstanding.taken).length === 0 && <p className="text-xs">—</p>}
            </div>
            <div className="rounded-lg bg-sky-500/10 p-2">
              <p className="text-xs text-muted-foreground">{t('finance.given')}</p>
              {Object.entries(outstanding.given).map(([cur, amt]) => (
                <p key={cur} className="text-sm font-semibold tabular-nums">{cur} {amt!.toLocaleString()}</p>
              ))}
              {Object.keys(outstanding.given).length === 0 && <p className="text-xs">—</p>}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming renewals */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Repeat className="h-4 w-4" />{t('finance.upcoming')}</h3>
          <div className="space-y-1.5">
            {upcoming.map((r) => {
              const d = daysUntil(r.next_renewal_date);
              return (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{r.service_name}</span>
                  <span className={`tabular-nums ${d <= 2 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {d === 0 ? t('finance.renewsToday') : `${d}d`}
                  </span>
                  <span className="ml-2 font-medium tabular-nums">{r.currency} {r.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sadaqah / Zakat */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-card border border-border p-3 shadow-soft">
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" />{t('finance.sadaqah')}</div>
          <p className="mt-1 text-base font-semibold tabular-nums text-[hsl(var(--success))]">
            {formatMoney(totals.sadaqah, settings.primary_currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3 shadow-soft" title={t('finance.zakatSub')}>
          <div className="text-xs text-muted-foreground">{t('finance.zakat')}</div>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {formatMoney(Math.max(0, totals.net) * 0.025, settings.primary_currency)}
          </p>
        </div>
      </div>

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
          <h3 className="text-sm font-semibold mb-2">{t('finance.recent')}</h3>
          <div className="space-y-2">
            {recent.map((tx) => {
              const c = tx.category_id ? catMap[tx.category_id] : null;
              const Icon = (Icons as any)[c?.icon || 'Tag'] || Icons.Tag;
              return (
                <div key={tx.id} className="flex items-center gap-2 text-xs">
                  <div className="h-7 w-7 rounded-lg gradient-soft flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{tx.pay_for || c?.name || '—'}</p>
                    <p className="text-muted-foreground">{new Date(tx.occurred_at).toLocaleDateString()}</p>
                  </div>
                  <CurrencyAmount amount={tx.amount} currency={tx.currency} signed={tx.kind} className="text-xs" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}