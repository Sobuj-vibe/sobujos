import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  useBudgets, useFinanceCategories, useFinanceSettings, useTransactions,
  convertCurrency, currentMonthStart,
} from '@/hooks/useFinance';
import { formatMoney } from './CurrencyAmount';
import { cn } from '@/lib/utils';

function monthDaysBack() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.ceil((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function BudgetsCard() {
  const { t } = useTranslation();
  const month = currentMonthStart();
  const { items: budgets, upsert } = useBudgets(month);
  const { categories } = useFinanceCategories();
  const { settings } = useFinanceSettings();
  const { items: tx } = useTransactions({ daysBack: monthDaysBack() });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const expenseCats = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);

  // Spend per category in primary currency, restricted to current month
  const spendByCat = useMemo(() => {
    const map = new Map<string, number>();
    const start = new Date(month);
    for (const x of tx) {
      if (x.kind !== 'expense' || !x.category_id) continue;
      if (new Date(x.occurred_at) < start) continue;
      map.set(
        x.category_id,
        (map.get(x.category_id) || 0) +
          convertCurrency(x.amount, x.currency, settings.primary_currency, settings),
      );
    }
    return map;
  }, [tx, settings, month]);

  const rows = useMemo(() => {
    const cur = settings.primary_currency;
    return budgets
      .map((b) => {
        const cat = expenseCats.find((c) => c.id === b.category_id);
        if (!cat) return null;
        const limit = convertCurrency(b.amount_limit, b.currency, cur, settings);
        const spent = spendByCat.get(b.category_id) || 0;
        const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        return { id: b.id, cat, limit, spent, pct, raw: b };
      })
      .filter(Boolean) as Array<{
        id: string; cat: typeof expenseCats[number]; limit: number; spent: number; pct: number; raw: typeof budgets[number];
      }>;
  }, [budgets, expenseCats, spendByCat, settings]);

  const startEditing = () => {
    const initial: Record<string, string> = {};
    for (const b of budgets) initial[b.category_id] = String(b.amount_limit);
    setDraft(initial);
    setEditing(true);
  };

  const saveAll = async () => {
    const cur = settings.primary_currency;
    for (const c of expenseCats) {
      const raw = draft[c.id];
      const num = raw === undefined || raw === '' ? 0 : Number(raw);
      if (Number.isNaN(num)) continue;
      const existing = budgets.find((b) => b.category_id === c.id);
      const existingVal = existing?.amount_limit ?? 0;
      if (num !== existingVal || (existing && existing.currency !== cur && num > 0)) {
        await upsert(c.id, num, cur);
      }
    }
    setEditing(false);
  };

  const hasAny = rows.length > 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />{t('finance.budgets')}
        </h3>
        {!editing ? (
          <button
            onClick={startEditing}
            className="text-xs flex items-center gap-1 text-primary hover:underline"
          >
            {hasAny ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {hasAny ? t('finance.editBudgets') : t('finance.setBudgets')}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-muted">
              <X className="h-3.5 w-3.5" />
            </button>
            <button onClick={saveAll} className="p-1 rounded gradient-primary text-primary-foreground">
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <p className="text-xs text-muted-foreground mb-1">
            {t('finance.budgetHint', { currency: settings.primary_currency })}
          </p>
          {expenseCats.map((c) => {
            const Icon = (Icons as any)[c.icon] || Icons.Tag;
            return (
              <div key={c.id} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg gradient-soft flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs flex-1 truncate">{c.name}</span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="0"
                  value={draft[c.id] ?? ''}
                  onChange={(e) => setDraft((p) => ({ ...p, [c.id]: e.target.value }))}
                  className="w-24 h-8 rounded-lg border border-border bg-background px-2 text-xs tabular-nums text-right"
                />
              </div>
            );
          })}
        </div>
      ) : !hasAny ? (
        <p className="text-xs text-muted-foreground">{t('finance.noBudgets')}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const Icon = (Icons as any)[r.cat.icon] || Icons.Tag;
            const over = r.spent > r.limit;
            const warn = !over && r.pct >= 80;
            const barColor = over
              ? 'bg-destructive'
              : warn
              ? 'bg-amber-500'
              : 'gradient-primary';
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{r.cat.name}</span>
                  </span>
                  <span className={cn('tabular-nums font-medium', over && 'text-destructive')}>
                    {formatMoney(r.spent, settings.primary_currency)}
                    <span className="text-muted-foreground"> / {formatMoney(r.limit, settings.primary_currency)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full transition-all', barColor)} style={{ width: `${r.pct}%` }} />
                </div>
                {over && (
                  <p className="text-[10px] text-destructive mt-0.5">
                    {t('finance.overBudget', {
                      amount: formatMoney(r.spent - r.limit, settings.primary_currency),
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}