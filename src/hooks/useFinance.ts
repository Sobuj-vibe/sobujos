import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimezone } from '@/contexts/TimezoneContext';
import { todayInTz } from '@/lib/datetime';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  Currency,
  Frequency,
} from '@/data/financeDefaults';

export type FinanceKind = 'income' | 'expense';

export type Category = {
  id: string;
  kind: FinanceKind;
  name: string;
  icon: string;
  color: string;
  position: number;
};

export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  position: number;
};

export type Transaction = {
  id: string;
  kind: FinanceKind;
  category_id: string | null;
  subcategory_id: string | null;
  amount: number;
  currency: Currency;
  pay_for: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  occurred_at: string;
  note: string | null;
  recurring_id: string | null;
};

export type Loan = {
  id: string;
  direction: 'taken' | 'given';
  person_name: string;
  reason: string | null;
  amount: number;
  currency: Currency;
  loan_date: string;
  expected_return_date: string | null;
  paid_at: string | null;
  note: string | null;
};

export type Recurring = {
  id: string;
  kind: FinanceKind;
  service_name: string;
  amount: number;
  currency: Currency;
  payment_method: string | null;
  category_id: string | null;
  start_date: string;
  next_renewal_date: string;
  frequency: Frequency;
  auto_post: boolean;
  logo_url: string | null;
  note: string | null;
};

export type FinanceSettings = {
  primary_currency: Currency;
  fx_bdt_per_cny: number;
  fx_usd_per_cny: number;
};

function emit() {
  window.dispatchEvent(new Event('ai-data-changed'));
}

/** Convert from any currency to target currency. Base = CNY. */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  s: FinanceSettings,
): number {
  if (from === to) return amount;
  // first to CNY
  let cny: number;
  if (from === 'CNY') cny = amount;
  else if (from === 'BDT') cny = amount / (s.fx_bdt_per_cny || 1);
  else cny = amount / (s.fx_usd_per_cny || 1); // USD
  if (to === 'CNY') return cny;
  if (to === 'BDT') return cny * s.fx_bdt_per_cny;
  return cny * s.fx_usd_per_cny;
}

export function useFinanceSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FinanceSettings>({
    primary_currency: 'BDT',
    fx_bdt_per_cny: 15.5,
    fx_usd_per_cny: 0.14,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_settings')
      .select('primary_currency,fx_bdt_per_cny,fx_usd_per_cny')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setSettings({
        primary_currency: data.primary_currency as Currency,
        fx_bdt_per_cny: Number(data.fx_bdt_per_cny),
        fx_usd_per_cny: Number(data.fx_usd_per_cny),
      });
    } else {
      // create default row
      await supabase.from('finance_settings').insert({ user_id: user.id });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const update = async (patch: Partial<FinanceSettings>) => {
    if (!user) return;
    await supabase.from('finance_settings').upsert({
      user_id: user.id,
      ...settings,
      ...patch,
    }, { onConflict: 'user_id' });
    setSettings((p) => ({ ...p, ...patch }));
    emit();
  };

  return { settings, loading, update, refresh };
}

export function useFinanceCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [cats, subs] = await Promise.all([
      supabase.from('finance_categories').select('*').eq('user_id', user.id).order('position'),
      supabase.from('finance_subcategories').select('*').eq('user_id', user.id).order('position'),
    ]);
    setCategories((cats.data as Category[]) || []);
    setSubcategories((subs.data as Subcategory[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const seedDefaults = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from('finance_categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count || 0) > 0) return;
    const allCats = [
      ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, kind: 'income' as const, position: i })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, kind: 'expense' as const, position: i })),
    ];
    const { data: inserted } = await supabase
      .from('finance_categories')
      .insert(
        allCats.map((c) => ({
          user_id: user.id,
          kind: c.kind,
          name: c.name,
          icon: c.icon,
          color: c.color,
          position: c.position,
        })),
      )
      .select();
    if (!inserted) return;
    const subRows: { user_id: string; category_id: string; name: string; position: number }[] = [];
    for (const row of inserted) {
      const def = allCats.find((c) => c.kind === row.kind && c.name === row.name);
      if (!def) continue;
      def.subs.forEach((s, i) =>
        subRows.push({ user_id: user.id, category_id: row.id, name: s, position: i }),
      );
    }
    if (subRows.length > 0) await supabase.from('finance_subcategories').insert(subRows);
    await refresh();
  }, [user, refresh]);

  useEffect(() => { if (user) seedDefaults(); }, [user, seedDefaults]);

  const addCategory = async (kind: FinanceKind, name: string, icon = 'Tag', color = 'indigo') => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_categories')
      .insert({ user_id: user.id, kind, name, icon, color })
      .select()
      .single();
    await refresh();
    return data;
  };

  const addSubcategory = async (category_id: string, name: string) => {
    if (!user) return;
    await supabase.from('finance_subcategories').insert({ user_id: user.id, category_id, name });
    await refresh();
  };

  const removeCategory = async (id: string) => {
    await supabase.from('finance_categories').delete().eq('id', id);
    await refresh();
  };
  const removeSubcategory = async (id: string) => {
    await supabase.from('finance_subcategories').delete().eq('id', id);
    await refresh();
  };

  return { categories, subcategories, loading, addCategory, addSubcategory, removeCategory, removeSubcategory, refresh };
}

export function useTransactions(opts?: { kind?: FinanceKind; daysBack?: number; limit?: number }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    let q = supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });
    if (opts?.kind) q = q.eq('kind', opts.kind);
    if (opts?.daysBack) {
      const from = new Date();
      from.setDate(from.getDate() - opts.daysBack);
      q = q.gte('occurred_at', from.toISOString());
    }
    if (opts?.limit) q = q.limit(opts.limit);
    const { data } = await q;
    setItems(((data as any[]) || []).map((d) => ({ ...d, amount: Number(d.amount) })));
    setLoading(false);
  }, [user, opts?.kind, opts?.daysBack, opts?.limit]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({ ...t, user_id: user.id })
      .select().single();
    if (error) throw error;
    await refresh();
    emit();
    return data;
  };

  const remove = async (id: string) => {
    await supabase.from('finance_transactions').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { items, loading, add, remove, refresh };
}

export function useLoans() {
  const { user } = useAuth();
  const [items, setItems] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_loans')
      .select('*')
      .eq('user_id', user.id)
      .order('loan_date', { ascending: false });
    setItems(((data as any[]) || []).map((d) => ({ ...d, amount: Number(d.amount) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (l: Omit<Loan, 'id' | 'paid_at'>) => {
    if (!user) return;
    await supabase.from('finance_loans').insert({ ...l, user_id: user.id });
    await refresh();
    emit();
  };
  const markPaid = async (id: string) => {
    await supabase.from('finance_loans').update({ paid_at: new Date().toISOString() }).eq('id', id);
    await refresh();
    emit();
  };
  const markUnpaid = async (id: string) => {
    await supabase.from('finance_loans').update({ paid_at: null }).eq('id', id);
    await refresh();
    emit();
  };
  const remove = async (id: string) => {
    await supabase.from('finance_loans').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { items, loading, add, markPaid, markUnpaid, remove, refresh };
}

export function nextRenewal(date: string, freq: Frequency): string {
  const d = new Date(date);
  if (freq === 'daily') d.setDate(d.getDate() + 1);
  else if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function useRecurring() {
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_recurring')
      .select('*')
      .eq('user_id', user.id)
      .order('next_renewal_date', { ascending: true });
    setItems(((data as any[]) || []).map((d) => ({ ...d, amount: Number(d.amount) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (r: Omit<Recurring, 'id'>) => {
    if (!user) return;
    await supabase.from('finance_recurring').insert({ ...r, user_id: user.id });
    await refresh();
    emit();
  };
  const update = async (id: string, patch: Partial<Recurring>) => {
    await supabase.from('finance_recurring').update(patch).eq('id', id);
    await refresh();
    emit();
  };
  const remove = async (id: string) => {
    await supabase.from('finance_recurring').delete().eq('id', id);
    await refresh();
    emit();
  };
  /** Auto-post any recurring items whose next_renewal_date has passed and roll forward. */
  const autoPostDue = useCallback(async () => {
    if (!user) return;
    const today = todayInTz(timezone);
    const due = items.filter((r) => r.auto_post && r.next_renewal_date <= today);
    for (const r of due) {
      await supabase.from('finance_transactions').insert({
        user_id: user.id,
        kind: r.kind,
        category_id: r.category_id,
        amount: r.amount,
        currency: r.currency,
        pay_for: r.service_name,
        payment_method: r.payment_method,
        occurred_at: new Date(r.next_renewal_date).toISOString(),
        note: 'Auto-posted from recurring',
        recurring_id: r.id,
      });
      let next = r.next_renewal_date;
      while (next <= today) next = nextRenewal(next, r.frequency);
      await supabase.from('finance_recurring').update({ next_renewal_date: next }).eq('id', r.id);
    }
    if (due.length > 0) {
      await refresh();
      emit();
    }
  }, [user, items, refresh, timezone]);

  useEffect(() => {
    if (!loading && items.length > 0) autoPostDue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return { items, loading, add, update, remove, refresh };
}

/** Upload a receipt image to private storage, returns the storage path. */
export async function uploadReceipt(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('finance-receipts').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function useSignedReceiptUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) { setUrl(null); return; }
    supabase.storage.from('finance-receipts').createSignedUrl(path, 60 * 60).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl || null);
    });
    return () => { cancelled = true; };
  }, [path]);
  return url;
}

export function useMonthSummary(daysBack = 30) {
  const { items: tx } = useTransactions({ daysBack });
  const { settings } = useFinanceSettings();
  return useMemo(() => {
    const inc = tx.filter((t) => t.kind === 'income');
    const exp = tx.filter((t) => t.kind === 'expense');
    const totalIn = inc.reduce(
      (s, t) => s + convertCurrency(t.amount, t.currency, settings.primary_currency, settings),
      0,
    );
    const totalOut = exp.reduce(
      (s, t) => s + convertCurrency(t.amount, t.currency, settings.primary_currency, settings),
      0,
    );
    return { totalIn, totalOut, net: totalIn - totalOut, currency: settings.primary_currency, count: tx.length };
  }, [tx, settings]);
}

export type Budget = {
  id: string;
  category_id: string;
  month: string; // YYYY-MM-01
  amount_limit: number;
  currency: Currency;
};

/** First day of the current month as YYYY-MM-DD. */
export function currentMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function useBudgets(month: string = currentMonthStart()) {
  const { user } = useAuth();
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month);
    setItems(((data as any[]) || []).map((d) => ({ ...d, amount_limit: Number(d.amount_limit) })));
    setLoading(false);
  }, [user, month]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const upsert = async (category_id: string, amount_limit: number, currency: Currency) => {
    if (!user) return;
    const existing = items.find((b) => b.category_id === category_id);
    if (amount_limit <= 0) {
      if (existing) await supabase.from('finance_budgets').delete().eq('id', existing.id);
    } else if (existing) {
      await supabase
        .from('finance_budgets')
        .update({ amount_limit, currency })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('finance_budgets')
        .insert({ user_id: user.id, category_id, month, amount_limit, currency });
    }
    await refresh();
    emit();
  };

  const remove = async (id: string) => {
    await supabase.from('finance_budgets').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { items, loading, upsert, remove, refresh };
}