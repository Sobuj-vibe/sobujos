import { Contact } from '@/hooks/useContacts';
import { Star, Lock, Phone as PhoneIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const colorBg: Record<string, string> = {
  indigo: 'bg-indigo-400', teal: 'bg-teal-400', rose: 'bg-rose-400',
  emerald: 'bg-emerald-400', amber: 'bg-amber-400', sky: 'bg-sky-400', slate: 'bg-slate-400',
};

export function ContactCard({
  contact, groupName, groupColor, primaryPhone, onClick, selectable, selected, onSelectChange,
}: {
  contact: Contact;
  groupName?: string;
  groupColor?: string;
  primaryPhone?: string;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (v: boolean) => void;
}) {
  const initials = contact.full_name.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  const grad = colorBg[groupColor || 'indigo'] || colorBg.indigo;

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-card border border-border tap',
      selected && 'border-primary bg-primary/5',
    )}>
      {selectable && (
        <Checkbox checked={selected} onCheckedChange={(v) => onSelectChange?.(!!v)} className="shrink-0" />
      )}
      <button onClick={onClick} className="flex-1 flex items-center gap-3 min-w-0 text-left">
        {contact.avatar_url ? (
          <img src={contact.avatar_url} alt={contact.full_name} className="h-11 w-11 rounded-full object-cover shrink-0" />
        ) : (
          <div className={cn('h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0', grad)}>
            {initials || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium truncate">{contact.full_name}</p>
            {contact.is_favorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
            {contact.is_private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {primaryPhone ? <span className="inline-flex items-center gap-1"><PhoneIcon className="h-3 w-3" />{primaryPhone}</span> : null}
            {primaryPhone && (groupName || contact.company) ? ' · ' : ''}
            {groupName || contact.company || ''}
          </p>
        </div>
      </button>
    </div>
  );
}
