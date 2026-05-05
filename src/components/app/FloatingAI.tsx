import { Sparkles, Paperclip, Send, X, Loader2, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type Attachment = { name: string; type: string; dataUrl: string };
type Msg = { role: 'user' | 'assistant'; content: string; attachments?: Attachment[] };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name}: max 8MB`);
        continue;
      }
      const dataUrl = await fileToDataUrl(f);
      next.push({ name: f.name, type: f.type, dataUrl });
    }
    setAttachments((a) => [...a, ...next]);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || loading || !session) return;
    const userMsg: Msg = { role: 'user', content: text, attachments };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    const sentAttachments = attachments;
    setAttachments([]);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
          attachments: sentAttachments,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '...' }]);
      // Notify other views to refresh if actions were taken
      if (data?.actions?.some((a: any) => a.ok && a.tool !== 'list_groups' && a.tool !== 'list_tasks')) {
        window.dispatchEvent(new CustomEvent('ai-data-changed'));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'AI error');
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'Something went wrong.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="AI Assistant"
        className="fixed right-4 md:right-6 z-40 tap shadow-elevated rounded-full h-14 w-14 flex items-center justify-center gradient-primary text-primary-foreground"
        style={{
          bottom: isMobile
            ? 'calc(5.5rem + env(safe-area-inset-bottom))'
            : '1.5rem',
        }}
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className={cn('p-0 flex flex-col', isMobile ? 'rounded-t-3xl h-[88vh]' : 'w-full sm:max-w-md h-full')}>
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> {t('ai.title')}
            </SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto h-14 w-14 rounded-2xl gradient-soft flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Ask me to create groups, tasks, subtasks, or send a photo / PDF and I'll extract them for you.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {['Create a Work group', 'Add task: Buy groceries tomorrow', 'What\'s overdue?'].map((s) => (
                    <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 tap">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'rounded-2xl px-3 py-2 text-sm max-w-[85%] break-words',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {m.attachments.map((a, j) => a.type.startsWith('image/') ? (
                        <img key={j} src={a.dataUrl} alt={a.name} className="h-20 w-20 object-cover rounded-lg" />
                      ) : (
                        <div key={j} className="flex items-center gap-1.5 bg-background/40 rounded-lg px-2 py-1 text-xs">
                          <FileText className="h-3.5 w-3.5" />{a.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 bg-muted text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative group">
                  {a.type.startsWith('image/') ? (
                    <img src={a.dataUrl} className="h-12 w-12 object-cover rounded-lg" alt={a.name} />
                  ) : (
                    <div className="h-12 px-2 rounded-lg bg-muted flex items-center gap-1 text-xs"><FileText className="h-3.5 w-3.5" />{a.name.slice(0, 14)}</div>
                  )}
                  <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t flex items-end gap-2" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              hidden
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            />
            <button onClick={() => fileRef.current?.click()} className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center tap" aria-label="Attach">
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Ask anything..."
              className="flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-h-32"
            />
            <button onClick={send} disabled={loading || (!input.trim() && attachments.length === 0)} className="h-10 w-10 shrink-0 rounded-full gradient-primary text-primary-foreground flex items-center justify-center tap disabled:opacity-50" aria-label="Send">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
