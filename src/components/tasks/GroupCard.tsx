import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as Icons from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

const colorMap: Record<string, string> = {
  indigo: 'from-indigo-400 to-purple-400',
  teal: 'from-teal-400 to-cyan-400',
  rose: 'from-rose-400 to-pink-400',
  emerald: 'from-emerald-400 to-teal-400',
  amber: 'from-amber-400 to-orange-400',
  sky: 'from-sky-400 to-blue-400',
};

export function GroupCard({ group }: { group: { id: string; name: string; color: string; icon: string } }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ total: 0, done: 0 });
  useEffect(() => {
    supabase.from('tasks').select('completed_at', { count: 'exact' }).eq('group_id', group.id).then(({ data }) => {
      const total = data?.length || 0;
      const done = data?.filter((d: any) => d.completed_at).length || 0;
      setStats({ total, done });
    });
  }, [group.id]);

  const Icon = (Icons[group.icon as keyof typeof Icons] as any) || Icons.Folder;
  const grad = colorMap[group.color] || colorMap.indigo;
  const pct = stats.total ? (stats.done / stats.total) * 100 : 0;

  return (
    <Link to={`/app/tasks/${group.id}`} className="block tap">
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft hover:shadow-elevated transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-soft`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            <p className="text-xs text-muted-foreground">{stats.done}/{stats.total} {t('common.completed').toLowerCase()}</p>
          </div>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
    </Link>
  );
}
