import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function QuickAdd() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: [{ role: 'user', content: text }] },
      });
      if (error) throw error;
      const reply = (data as any)?.reply || 'Done';
      toast.success(reply.slice(0, 200));
      setText('');
      window.dispatchEvent(new Event('ai-data-changed'));
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-3">
      <label className="text-xs font-medium text-primary flex items-center gap-1 mb-2">
        <Sparkles className="h-3 w-3" />{t('finance.quickAdd')}
      </label>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('finance.quickAddPlaceholder')}
          disabled={busy}
          className="flex-1 bg-background"
        />
        <Button onClick={submit} disabled={busy || !text.trim()} size="sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}