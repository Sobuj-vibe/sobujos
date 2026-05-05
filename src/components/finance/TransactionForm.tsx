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
import { CURRENCIES, PAYMENT_METHODS, Currency } from '@/data/financeDefaults';
import { FinanceKind, useFinanceCategories, useTransactions } from '@/hooks/useFinance';
import { ReceiptUpload } from './ReceiptUpload';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTimezone } from '@/contexts/TimezoneContext';
import { localDateTimeInputInTz } from '@/lib/datetime';

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  kind: FinanceKind;
  defaults?: { amount?: number; currency?: Currency; pay_for?: string; occurred_at?: string };
};

export function TransactionForm({ open, onOpenChange, kind, defaults }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const { categories, subcategories, addCategory, addSubcategory } = useFinanceCategories();
  const { add } = useTransactions({ kind });

  const cats = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);

  const [categoryId, setCategoryId] = useState<string>('');
  const [subId, setSubId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('BDT');
  const [payFor, setPayFor] = useState('');
  const [method, setMethod] = useState<string>('Cash');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [when, setWhen] = useState<string>(() => localDateTimeInputInTz(new Date(), timezone));
  const [note, setNote] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState('');

  useEffect(() => {
    if (open) {
      setCategoryId(cats[0]?.id || '');
      setSubId('');
      setAmount(defaults?.amount ? String(defaults.amount) : '');
      setCurrency(defaults?.currency || 'BDT');
      setPayFor(defaults?.pay_for || '');
      setMethod('Cash');
      setReceipt(null);
      setWhen(defaults?.occurred_at || localDateTimeInputInTz(new Date(), timezone));
      setNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const subs = useMemo(
    () => subcategories.filter((s) => s.category_id === categoryId),
    [subcategories, categoryId],
  );

  const runOcr = async (path: string) => {
    if (!user) return;
    setOcrBusy(true);
    try {
      const { data: signed } = await supabase.storage
        .from('finance-receipts').createSignedUrl(path, 60 * 5);
      const url = signed?.signedUrl;
      if (!url) throw new Error('No signed url');
      const { data, error } = await supabase.functions.invoke('finance-ocr', {
        body: { image_url: url },
      });
      if (error) throw error;
      const r = data as { amount?: number; currency?: Currency; vendor?: string; occurred_at?: string };
      if (r.amount) setAmount(String(r.amount));
      if (r.currency && CURRENCIES.includes(r.currency as any)) setCurrency(r.currency);
      if (r.vendor) setPayFor(r.vendor);
      if (r.occurred_at) setWhen(r.occurred_at.slice(0, 16));
      toast.success(t('finance.ocrFilled'));
    } catch (e: any) {
      console.error('OCR failed', e);
    } finally {
      setOcrBusy(false);
    }
  };

  const submit = async () => {
    if (!amount || !categoryId) {
      toast.error('Amount and category required');
      return;
    }
    try {
      await add({
        kind,
        category_id: categoryId,
        subcategory_id: subId || null,
        amount: Number(amount),
        currency,
        pay_for: payFor || null,
        payment_method: method,
        receipt_url: receipt,
        occurred_at: new Date(when).toISOString(),
        note: note || null,
        recurring_id: null,
      });
      toast.success(t('finance.saved'));
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddCat = async () => {
    const name = newCat.trim();
    if (!name) return;
    const c = await addCategory(kind, name);
    if (c) setCategoryId(c.id);
    setNewCat('');
  };
  const handleAddSub = async () => {
    const name = newSub.trim();
    if (!name || !categoryId) return;
    await addSubcategory(categoryId, name);
    setNewSub('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{kind === 'income' ? t('finance.addIncome') : t('finance.addExpense')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label>{t('finance.amount')}</Label>
              <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t('finance.currency')}</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t('finance.category')}</Label>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubId(''); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <Input placeholder={t('finance.addCategory')} value={newCat} onChange={(e) => setNewCat(e.target.value)} className="h-8 text-xs" />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCat}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {subs.length > 0 || categoryId ? (
            <div>
              <Label>{t('finance.subcategory')}</Label>
              <Select value={subId || 'none'} onValueChange={(v) => setSubId(v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {subs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-2">
                <Input placeholder={t('finance.addSubcategory')} value={newSub} onChange={(e) => setNewSub(e.target.value)} className="h-8 text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={handleAddSub}><Plus className="h-3 w-3" /></Button>
              </div>
            </div>
          ) : null}

          <div>
            <Label>{t('finance.payFor')}</Label>
            <Input value={payFor} onChange={(e) => setPayFor(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>{t('finance.paymentMethod')}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('finance.dateTime')}</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              {t('finance.receipt')}
              {ocrBusy && <span className="text-xs text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" />{t('finance.ocrParsing')}</span>}
            </Label>
            <div className="mt-1">
              <ReceiptUpload value={receipt} onChange={setReceipt} onUploaded={runOcr} label={t('finance.uploadReceipt')} />
            </div>
          </div>

          <div>
            <Label>{t('finance.note')}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" />
          </div>

          <Button onClick={submit} className="w-full">{t('common.save')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}