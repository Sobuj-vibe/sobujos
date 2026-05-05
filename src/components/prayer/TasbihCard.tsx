import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useTasbih } from '@/hooks/usePrayer';

export function TasbihCard() {
  const { t } = useTranslation();
  const { items, add, inc, reset, remove } = useTasbih();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('33');
  const [show, setShow] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{t('prayer.tasbih')}</h3>
        <Button size="sm" variant="ghost" onClick={() => setShow((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> {t('prayer.tasbihAdd')}
        </Button>
      </div>
      {show && (
        <div className="flex gap-2">
          <Input placeholder={t('prayer.tasbihName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" className="w-20" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Button onClick={() => { if (name) { add(name, Number(target) || 33); setName(''); setShow(false); } }}>
            {t('common.add')}
          </Button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const pct = Math.min(100, (it.count / Math.max(1, it.target)) * 100);
            return (
              <div key={it.id} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.count} / {it.target}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => reset(it)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-background overflow-hidden mt-2">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <Button onClick={() => inc(it)} className="w-full mt-2 h-12 text-base">+1</Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}