import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, PAYMENT_METHODS, FREQUENCIES, Currency, Frequency } from '@/data/financeDefaults';
import { FinanceKind, useFinanceCategories, useRecurring, Recurring, nextRenewal } from '@/hooks/useFinance';
import { CurrencyAmount } from './CurrencyAmount';
import { Plus, Trash2, Repeat, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimezone } from '@/contexts/TimezoneContext';
import { todayInTz } from '@/lib/datetime';

function daysUntil(date: string) {
  const d = new Date(date);
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function RecurringCard({ r, onDelete, onEdit }: { r: Recurring; onDelete: (id: string) => void; onEdit: (r: Recurring) => void }) {
  const { t } = useTranslation();
  const days = daysUntil(r.next_renewal_date);
  const soon = days <= 5 && days >= 0;
  return (
    <div className={cn(
      'rounded-xl border p-3 flex items-center gap-3',
      soon ? 'bg-destructive/10 border-destructive/40' : 'bg-card border-border',
    )}>
      <div className="h-10 w-10 rounded-lg gradient-soft flex items-center justify-center shrink-0">
        <Repeat className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{r.service_name}</p>
        <p className="text-xs text-muted-foreground">
          {t(`finance.${r.frequency}`)} · {r.payment_method || '—'}
        </p>
        <p className="text-xs mt-0.5">
          {days === 0 ? t('finance.renewsToday') : `${t('finance.renewsIn')} ${days} ${t('finance.renewedDays')}`}
        </p>
      </div>
      <div className="text-right">
        <CurrencyAmount amount={r.amount} currency={r.currency} signed={r.kind} className="text-sm" />
        <div className="mt-1 flex justify-end gap-1">
          <button onClick={() => onEdit(r)} className="p-1 text-muted-foreground hover:text-primary">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(r.id)} className="p-1 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RecurringForm({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (b: boolean) => void; editing?: Recurring | null }) {
  const { t } = useTranslation();
  const { add, update } = useRecurring();
  const { categories } = useFinanceCategories();
  const { timezone } = useTimezone();
  const [kind, setKind] = useState<FinanceKind>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('BDT');
  const [method, setMethod] = useState<string>('Cash');
  const [categoryId, setCategoryId] = useState<string>('');
  const [start, setStart] = useState(() => todayInTz(timezone));
  const [next, setNext] = useState(() => nextRenewal(todayInTz(timezone), 'monthly'));
  const [freq, setFreq] = useState<Frequency>('monthly');
  const [autoPost, setAutoPost] = useState(false);
  const [note, setNote] = useState('');

  const cats = categories.filter((c) => c.kind === kind);
  useEffect(() => { setCategoryId(cats[0]?.id || ''); /* eslint-disable-next-line */ }, [kind, categories.length]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKind(editing.kind);
      setName(editing.service_name);
      setAmount(String(editing.amount));
      setCurrency(editing.currency);
      setMethod(editing.payment_method || 'Cash');
      setCategoryId(editing.category_id || '');
      setStart(editing.start_date);
      setNext(editing.next_renewal_date);
      setFreq(editing.frequency);
      setAutoPost(editing.auto_post);
      setNote(editing.note || '');
    } else {
      setName(''); setAmount(''); setNote(''); setAutoPost(false);
      setStart(todayInTz(timezone));
      setNext(nextRenewal(todayInTz(timezone), 'monthly'));
      setFreq('monthly');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!name.trim() || !amount) { toast.error('Name and amount required'); return; }
    const payload = {
      kind,
      service_name: name.trim(),
      amount: Number(amount),
      currency,
      payment_method: method,
      category_id: categoryId || null,
      start_date: start,
      next_renewal_date: next,
      frequency: freq,
      auto_post: autoPost,
      logo_url: editing?.logo_url ?? null,
      note: note || null,
    };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    toast.success(t('finance.saved'));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>{editing ? t('common.edit') : t('finance.addRecurring')}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={kind === 'expense' ? 'default' : 'outline'} onClick={() => setKind('expense')}>{t('finance.expense')}</Button>
            <Button type="button" variant={kind === 'income' ? 'default' : 'outline'} onClick={() => setKind('income')}>{t('finance.income')}</Button>
          </div>
          <div><Label>{t('finance.serviceName')}</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><Label>{t('finance.amount')}</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>{t('finance.currency')}</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t('finance.frequency')}</Label>
            <Select value={freq} onValueChange={(v) => { setFreq(v as Frequency); setNext(nextRenewal(start, v as Frequency)); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{t(`finance.${f}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('finance.category')}</Label>
            <Select value={categoryId || 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('finance.paymentMethod')}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{t('finance.startDate')}</Label><Input type="date" value={start} onChange={(e) => { setStart(e.target.value); setNext(nextRenewal(e.target.value, freq)); }} className="mt-1" /></div>
            <div><Label>{t('finance.nextRenewal')}</Label><Input type="date" value={next} onChange={(e) => setNext(e.target.value)} className="mt-1" /></div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <Label htmlFor="autopost" className="cursor-pointer">{t('finance.autoPost')}</Label>
            <Switch id="autopost" checked={autoPost} onCheckedChange={setAutoPost} />
          </div>
          <div><Label>{t('finance.note')}</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" /></div>
          <Button onClick={submit} className="w-full">{t('common.save')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function RecurringSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const { items, remove } = useRecurring();
  const { timezone } = useTimezone();

  const grouped = useMemo(() => ({
    expense: items.filter((r) => r.kind === 'expense'),
    income: items.filter((r) => r.kind === 'income'),
  }), [items]);

  // Reminder toast for items renewing in <=5 days
  useEffect(() => {
    const due = items.filter((r) => {
      const d = daysUntil(r.next_renewal_date);
      return d >= 0 && d <= 5;
    });
    if (due.length > 0) {
      const key = `finance-reminded-${todayInTz(timezone)}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        toast.message(`${due.length} subscription${due.length>1?'s':''} renewing soon`, {
          description: due.slice(0,3).map(r => r.service_name).join(', '),
        });
      }
    }
  }, [items]);

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen(true)} className="w-full"><Plus className="h-4 w-4" />{t('finance.addRecurring')}</Button>
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t('finance.empty')}</p>}
      {grouped.expense.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('finance.expense')}</h3>
          {grouped.expense.map((r) => <RecurringCard key={r.id} r={r} onDelete={remove} onEdit={(rr) => { setEditing(rr); setOpen(true); }} />)}
        </div>
      )}
      {grouped.income.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('finance.income')}</h3>
          {grouped.income.map((r) => <RecurringCard key={r.id} r={r} onDelete={remove} onEdit={(rr) => { setEditing(rr); setOpen(true); }} />)}
        </div>
      )}
      <RecurringForm open={open} onOpenChange={(b) => { setOpen(b); if (!b) setEditing(null); }} editing={editing} />
    </div>
  );
}