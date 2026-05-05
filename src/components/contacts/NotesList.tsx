import { useState } from 'react';
import { ContactNote } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Pin, PinOff, Trash2, Plus } from 'lucide-react';

export function NotesList({ contactId, notes, onChanged }: { contactId: string; notes: ContactNote[]; onChanged: () => void }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const add = async () => {
    if (!user || !draft.trim()) return;
    await supabase.from('contact_notes').insert({ user_id: user.id, contact_id: contactId, body: draft.trim() });
    setDraft('');
    onChanged();
  };
  const togglePin = async (n: ContactNote) => {
    await supabase.from('contact_notes').update({ is_pinned: !n.is_pinned }).eq('id', n.id);
    onChanged();
  };
  const del = async (id: string) => {
    await supabase.from('contact_notes').delete().eq('id', id);
    onChanged();
  };
  const saveEdit = async (id: string) => {
    if (!editBody.trim()) return;
    await supabase.from('contact_notes').update({ body: editBody.trim() }).eq('id', id);
    setEditing(null);
    onChanged();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-muted/30 border border-border p-3 space-y-2">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a note…" rows={2} maxLength={2000} />
        <Button onClick={add} size="sm" disabled={!draft.trim()} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add note</Button>
      </div>
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className={`rounded-2xl border p-3 ${n.is_pinned ? 'bg-amber-50/40 dark:bg-amber-500/5 border-amber-300/40' : 'bg-card border-border'}`}>
            {editing === n.id ? (
              <div className="space-y-2">
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} maxLength={2000} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(n.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap" onClick={() => { setEditing(n.id); setEditBody(n.body); }}>{n.body}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePin(n)}>
                      {n.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {!notes.length && <p className="text-sm text-muted-foreground text-center py-6">No notes yet.</p>}
      </div>
    </div>
  );
}
