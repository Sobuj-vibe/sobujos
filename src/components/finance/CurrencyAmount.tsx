import { Currency, CURRENCY_SYMBOLS } from '@/data/financeDefaults';
import { useFinanceSettings, convertCurrency } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';

type Props = {
  amount: number;
  currency: Currency;
  showOriginal?: boolean;
  className?: string;
  signed?: 'income' | 'expense';
};

export function formatMoney(amount: number, currency: Currency) {
  const sym = CURRENCY_SYMBOLS[currency];
  return `${sym}${amount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
}

export function CurrencyAmount({ amount, currency, showOriginal, className, signed }: Props) {
  const { settings } = useFinanceSettings();
  const primary = convertCurrency(amount, currency, settings.primary_currency, settings);
  const isPrimary = currency === settings.primary_currency;
  const sign = signed === 'expense' ? '-' : signed === 'income' ? '+' : '';
  const colorClass = signed === 'expense' ? 'text-destructive' : signed === 'income' ? 'text-[hsl(var(--success))]' : '';
  return (
    <span className={cn('tabular-nums', className)}>
      <span className={cn('font-semibold', colorClass)}>
        {sign}{formatMoney(isPrimary ? amount : primary, settings.primary_currency)}
      </span>
      {showOriginal && !isPrimary && (
        <span className="ml-1 text-xs text-muted-foreground">
          ({formatMoney(amount, currency)})
        </span>
      )}
    </span>
  );
}