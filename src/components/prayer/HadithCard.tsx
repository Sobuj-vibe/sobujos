import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { BookOpenText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Hadith = { text_bn: string; text_en: string; reference: string };

export function HadithCard() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (refresh = false) => {
    setLoading(true);
    try {
      const { data: res } = await supabase.functions.invoke('prayer-hadith', {
        body: { refresh },
      });
      if (res?.hadith) setData(res.hadith);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const text = i18n.language === 'en' ? data?.text_en : data?.text_bn;

  return (
    <div className="rounded-2xl gradient-soft border border-border p-4 space-y-3 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center">
            <BookOpenText className="h-4 w-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-sm">{t('prayer.hadithTitle')}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => load(true)} disabled={loading} className="h-8 w-8">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {loading && !data ? (
        <div className="h-16 rounded bg-muted animate-pulse" />
      ) : data ? (
        <div>
          <p className="text-sm leading-relaxed">{text}</p>
          <p className="text-xs text-muted-foreground mt-2">— {data.reference}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">…</p>
      )}
    </div>
  );
}