import { useState } from 'react';
import { ContactEvent } from '@/hooks/useContacts';
import { Phone, MessageCircle, Coffee, Mail, MessageSquare, FileText, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';

const KIND_META: Record<string, { icon: any; label: string }> = {
  call: { icon: Phone, label: 'Called' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp' },
  meet: { icon: Coffee, label: 'Met' },
  email: { icon: Mail, label: 'Emailed' },
  sms: { icon: MessageSquare, label: 'Texted' },
  note: { icon: FileText, label: 'Note' },
  custom: { icon: Sparkles, label: 'Event' },
};

export function EventsTimeline({
  contactId, events, onChanged,
}: {
  contactId: string;
  events: ContactEvent[];
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [summary, setSummary] = useState('');

  const log = async (kind: keyof typeof KIND_META) => {
    if (!user) return;
    await supabase.from('contact_events').insert({
      user_id: user.id, contact_id: contactId, kind: kind as any,
      summary: summary || null, occurred_at: new Date().toISOString(),
    });
    await supabase.from('contacts').update({ last_interaction_at: new Date().toISOString() }).eq('id', contactId);
    setSummary('');
    onChanged();
  };
  const del = async (id: string) => {
    await supabase.from('contact_events').delete().eq('id', id);
    onChanged();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-muted/30 border border-border p-3 space-y-2">
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Optional note for the event…" maxLength={200} />
        <div className="grid grid-cols-3 gap-1.5">
          {(['call', 'whatsapp', 'meet', 'email', 'sms', 'note'] as const).map((k) => {
            const I = KIND_META[k].icon;
            return (
              <Button key={k} type="button" size="sm" variant="secondary" className="h-9" onClick={() => log(k)}>
                <I className="h-3.5 w-3.5 mr-1" /> {KIND_META[k].label}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        {events.map((e) => {
          const I = (KIND_META[e.kind]?.icon) || Sparkles;
          return (
            <div key={e.id} className="flex items-start gap-3 py-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <I className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{KIND_META[e.kind]?.label || e.kind}</p>
                {e.summary && <p className="text-xs text-muted-foreground">{e.summary}</p>}
                <p className="text-[11px] text-muted-foreground">{new Date(e.occurred_at).toLocaleString()}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(e.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
        {!events.length && <p className="text-sm text-muted-foreground text-center py-6">No interactions logged yet.</p>}
      </div>
    </div>
  );
}
