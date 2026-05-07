import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, Currency } from '@/data/financeDefaults';
import { useLoans, Loan } from '@/hooks/useFinance';
import { CurrencyAmount } from './CurrencyAmount';
import { CheckCircle2, RotateCcw, Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimezone } from '@/contexts/TimezoneContext';
import { todayInTz } from '@/lib/datetime';

function LoanCard({ loan, onPaid, onUnpaid, onDelete, onEdit }: {
  loan: Loan;
  onPaid: (id: string) => void;
  onUnpaid: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (loan: Loan) => void;
}) {
  const { t } = useTranslation();
  const today = new Date();
  const exp = loan.expected_return_date ? new Date(loan.expected_return_date) : null;
  const days = exp ? Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const paid = !!loan.paid_at;
  const tone = paid
    ? 'bg-[hsl(var(--success)/0.12)] border-[hsl(var(--success)/0.4)]'
    : loan.direction === 'given'
      ? 'bg-sky-500/10 border-sky-500/40 dark:bg-sky-500/15'
      : 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-500/15';

  return (
    <div className={cn('rounded-xl border p-3 relative', tone, paid && 'opacity-60')}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{loan.person_name}</p>
          <p className="text-xs text-muted-foreground">{loan.reason || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(loan.loan_date).toLocaleDateString()}
            {exp && ` → ${exp.toLocaleDateString()}`}
            {!paid && days !== null && (
              <span className={cn('ml-2 font-medium', days < 0 ? 'text-destructive' : 'text-foreground')}>
                {days < 0 ? `${-days} ${t('finance.daysOverdue')}` : `${days} ${t('finance.daysLeft')}`}
              </span>
            )}
          </p>
          {loan.note && <p className="text-xs mt-1">{loan.note}</p>}
        </div>
        <div className="text-right">
          <CurrencyAmount amount={loan.amount} currency={loan.currency} showOriginal className="text-sm" />
          <div className="mt-2 flex justify-end gap-1">
            {paid ? (
              <button onClick={() => onUnpaid(loan.id)} className="text-xs px-2 py-1 rounded hover:bg-background/50 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />{t('finance.markUnpaid')}
              </button>
            ) : (
              <button onClick={() => onPaid(loan.id)} className="text-xs px-2 py-1 rounded bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />{t('finance.markPaid')}
              </button>
            )}
            <button onClick={() => onEdit(loan)} className="p-1 text-muted-foreground hover:text-primary">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(loan.id)} className="p-1 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoanForm({ open, onOpenChange, defaultDirection, editing }: { open: boolean; onOpenChange: (b: boolean) => void; defaultDirection: 'taken' | 'given'; editing?: Loan | null }) {
  const { t } = useTranslation();
  const { add, update } = useLoans();
  const { timezone } = useTimezone();
  const [direction, setDirection] = useState<'taken' | 'given'>(defaultDirection);
  const [person, setPerson] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('BDT');
  const [loanDate, setLoanDate] = useState(() => todayInTz(timezone));
  const [returnDate, setReturnDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDirection(editing.direction);
      setPerson(editing.person_name);
      setReason(editing.reason || '');
      setAmount(String(editing.amount));
      setCurrency(editing.currency);
      setLoanDate(editing.loan_date);
      setReturnDate(editing.expected_return_date || '');
      setNote(editing.note || '');
    } else {
      setDirection(defaultDirection);
      setPerson(''); setReason(''); setAmount(''); setCurrency('BDT');
      setLoanDate(todayInTz(timezone)); setReturnDate(''); setNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!person.trim() || !amount) {
      toast.error('Person and amount required');
      return;
    }
    const payload = {
      direction,
      person_name: person.trim(),
      reason: reason || null,
      amount: Number(amount),
      currency,
      loan_date: loanDate,
      expected_return_date: returnDate || null,
      note: note || null,
    };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    toast.success(t('finance.saved'));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>{editing ? t('common.edit') : t('finance.addLoan')}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>{t('finance.direction')}</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button type="button" variant={direction === 'taken' ? 'default' : 'outline'} onClick={() => setDirection('taken')}>{t('finance.taken')}</Button>
              <Button type="button" variant={direction === 'given' ? 'default' : 'outline'} onClick={() => setDirection('given')}>{t('finance.given')}</Button>
            </div>
          </div>
          <div><Label>{t('finance.person')}</Label><Input value={person} onChange={(e) => setPerson(e.target.value)} className="mt-1" /></div>
          <div><Label>{t('finance.reason')}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" /></div>
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
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{t('finance.loanDate')}</Label><Input type="date" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} className="mt-1" /></div>
            <div><Label>{t('finance.expectedReturn')}</Label><Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>{t('finance.note')}</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" /></div>
          <Button onClick={submit} className="w-full">{t('common.save')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LoansSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [side, setSide] = useState<'taken' | 'given'>('taken');
  const { items, markPaid, markUnpaid, remove } = useLoans();

  const lists = useMemo(() => ({
    taken: items.filter((l) => l.direction === 'taken'),
    given: items.filter((l) => l.direction === 'given'),
  }), [items]);

  const list = lists[side];
  const outstanding = list.filter((l) => !l.paid_at);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-muted">
        <button onClick={() => setSide('taken')} className={cn('h-8 rounded-full text-xs font-medium', side === 'taken' ? 'bg-card shadow-soft' : 'text-muted-foreground')}>{t('finance.taken')}</button>
        <button onClick={() => setSide('given')} className={cn('h-8 rounded-full text-xs font-medium', side === 'given' ? 'bg-card shadow-soft' : 'text-muted-foreground')}>{t('finance.given')}</button>
      </div>

      <Button onClick={() => setOpen(true)} className="w-full"><Plus className="h-4 w-4" />{t('finance.addLoan')}</Button>

      {outstanding.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('finance.outstandingLoans')}</span>
          <div className="text-right space-y-0.5">
            {(['BDT', 'CNY', 'USD'] as Currency[]).map((cur) => {
              const sum = outstanding.filter((l) => l.currency === cur).reduce((s, l) => s + l.amount, 0);
              if (!sum) return null;
              return <div key={cur} className="text-sm font-semibold tabular-nums">{cur} {sum.toLocaleString()}</div>;
            })}
          </div>
        </div>
      )}

      {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t('finance.empty')}</p>}
      <div className="space-y-2">
        {list.map((l) => (
          <LoanCard key={l.id} loan={l} onPaid={markPaid} onUnpaid={markUnpaid} onDelete={remove} onEdit={(loan) => { setEditing(loan); setOpen(true); }} />
        ))}
      </div>

      <LoanForm open={open} onOpenChange={(b) => { setOpen(b); if (!b) setEditing(null); }} defaultDirection={side} editing={editing} />
    </div>
  );
}