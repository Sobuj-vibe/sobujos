import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { Trash2, Image as ImageIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FinanceKind, useFinanceCategories, useTransactions, useSignedReceiptUrl, Transaction } from '@/hooks/useFinance';
import { CurrencyAmount } from './CurrencyAmount';
import { Plus } from 'lucide-react';
import { TransactionForm } from './TransactionForm';

function ReceiptThumb({ path }: { path: string | null }) {
  const url = useSignedReceiptUrl(path);
  if (!path) return null;
  if (!url) return <ImageIcon className="h-3 w-3 text-muted-foreground" />;
  return <img src={url} alt="" className="h-8 w-8 rounded object-cover border border-border" />;
}

function Row({ tx, catName, iconName }: { tx: Transaction; catName: string; iconName: string }) {
  const Icon = (Icons as any)[iconName] || Icons.Tag;
  const date = new Date(tx.occurred_at);
  return (
    <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg gradient-soft flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tx.pay_for || catName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {catName} · {tx.payment_method} · {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <ReceiptThumb path={tx.receipt_url} />
      <CurrencyAmount amount={tx.amount} currency={tx.currency} signed={tx.kind} showOriginal className="text-sm" />
    </div>
  );
}

export function TransactionList({ kind }: { kind: FinanceKind }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { items, remove } = useTransactions({ kind });
  const { categories } = useFinanceCategories();
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (catFilter !== 'all' && t.category_id !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (t.pay_for || '').toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, search, catFilter]);

  const cats = categories.filter((c) => c.kind === kind);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button onClick={() => setOpen(true)} className="flex-1">
          <Plus className="h-4 w-4" />
          {kind === 'income' ? t('finance.addIncome') : t('finance.addExpense')}
        </Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 h-9" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">{t('finance.empty')}</p>
      )}
      <div className="space-y-2">
        {filtered.map((tx) => {
          const c = tx.category_id ? catMap[tx.category_id] : null;
          return (
            <div key={tx.id} className="group relative">
              <Row tx={tx} catName={c?.name || '—'} iconName={c?.icon || 'Tag'} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                <button
                  onClick={() => { setEditing(tx); setOpen(true); }}
                  className="p-1 text-muted-foreground hover:text-primary"
                  aria-label="edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(tx.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label="delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <TransactionForm
        open={open}
        onOpenChange={(b) => { setOpen(b); if (!b) setEditing(null); }}
        kind={kind}
        editing={editing}
      />
    </div>
  );
}