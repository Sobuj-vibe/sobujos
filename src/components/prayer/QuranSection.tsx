import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, BookOpen } from 'lucide-react';
import { SURAHS } from '@/data/surahs';
import { useQuranLogs } from '@/hooks/usePrayer';
import { useTimezone } from '@/contexts/TimezoneContext';
import { todayInTz } from '@/lib/datetime';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function QuranSection() {
  const { t, i18n } = useTranslation();
  const { logs, add, remove } = useQuranLogs();
  const { timezone } = useTimezone();
  const [surahNum, setSurahNum] = useState<string>('1');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');

  const surahLabel = (s: typeof SURAHS[number]) =>
    i18n.language === 'en' ? `${s.number}. ${s.en}` : `${s.number}. ${s.bn}`;

  const submit = async () => {
    const s = SURAHS.find((x) => x.number === Number(surahNum));
    if (!s || !from) return;
    await add({
      date: todayInTz(timezone),
      surah_number: s.number,
      surah_name: i18n.language === 'en' ? s.en : s.bn,
      ayat_from: Number(from),
      ayat_to: to ? Number(to) : null,
      note: note || null,
    });
    setFrom('1'); setTo(''); setNote('');
    toast.success(t('prayer.saved'));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft space-y-3">
        <h3 className="font-semibold text-sm">{t('prayer.quranTitle')}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">{t('prayer.surah')}</label>
            <Select value={surahNum} onValueChange={setSurahNum}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {SURAHS.map((s) => (
                  <SelectItem key={s.number} value={String(s.number)}>{surahLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('prayer.ayatFrom')}</label>
            <Input type="number" min={1} value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('prayer.ayatTo')}</label>
            <Input type="number" min={1} value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">{t('prayer.note')}</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" rows={2} />
          </div>
        </div>
        <Button onClick={submit} className="w-full">{t('prayer.addEntry')}</Button>
      </div>

      <div className="space-y-2">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">{t('prayer.quranEmpty')}</p>
        )}
        {logs.map((l) => (
          <div key={l.id} className="rounded-xl bg-card border border-border p-3 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg gradient-soft flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {l.surah_name} · {l.ayat_from}{l.ayat_to ? `–${l.ayat_to}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">{l.date}</p>
              {l.note && <p className="text-xs mt-1 leading-snug">{l.note}</p>}
            </div>
            <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}