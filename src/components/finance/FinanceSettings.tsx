import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, Currency } from '@/data/financeDefaults';
import { useFinanceSettings } from '@/hooks/useFinance';
import { toast } from 'sonner';

export function FinanceSettings() {
  const { t } = useTranslation();
  const { settings, update } = useFinanceSettings();
  const [primary, setPrimary] = useState<Currency>(settings.primary_currency);
  const [bdt, setBdt] = useState(String(settings.fx_bdt_per_cny));
  const [usd, setUsd] = useState(String(settings.fx_usd_per_cny));

  useEffect(() => {
    setPrimary(settings.primary_currency);
    setBdt(String(settings.fx_bdt_per_cny));
    setUsd(String(settings.fx_usd_per_cny));
  }, [settings]);

  const save = async () => {
    await update({
      primary_currency: primary,
      fx_bdt_per_cny: Number(bdt) || 1,
      fx_usd_per_cny: Number(usd) || 1,
    });
    toast.success(t('finance.saved'));
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 shadow-soft">
      <h3 className="font-semibold text-sm">{t('finance.settings')}</h3>
      <div>
        <Label>{t('finance.primaryCurrency')}</Label>
        <Select value={primary} onValueChange={(v) => setPrimary(v as Currency)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{t('finance.fxBdtPerCny')}</Label>
          <Input type="number" step="0.0001" value={bdt} onChange={(e) => setBdt(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>{t('finance.fxUsdPerCny')}</Label>
          <Input type="number" step="0.0001" value={usd} onChange={(e) => setUsd(e.target.value)} className="mt-1" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t('finance.fxNote')}</p>
      <Button onClick={save} className="w-full">{t('common.save')}</Button>
    </div>
  );
}