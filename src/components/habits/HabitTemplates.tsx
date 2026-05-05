import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { HABIT_TEMPLATES } from '@/data/habitTemplates';
import { useHabits } from '@/hooks/useHabits';
import { toast } from 'sonner';

export function HabitTemplates({ onAdded }: { onAdded?: () => void }) {
  const { t, i18n } = useTranslation();
  const { add } = useHabits();
  const lang = i18n.language;

  const create = async (key: string) => {
    const tpl = HABIT_TEMPLATES.find((x) => x.key === key);
    if (!tpl) return;
    await add({
      name: lang === 'bn' ? tpl.name_bn : tpl.name_en,
      icon: tpl.icon,
      color: tpl.color,
      type: tpl.type,
      target_unit: tpl.target_unit ?? null,
      target_value: tpl.target_value ?? null,
      schedule_kind: tpl.schedule_kind,
      schedule_days: tpl.schedule_days ?? null,
      weekly_count: tpl.weekly_count ?? null,
      time_of_day: tpl.time_of_day,
      why: lang === 'bn' ? tpl.why_bn ?? null : tpl.why_en ?? null,
    });
    toast.success(t('habits.added'));
    onAdded?.();
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <h3 className="text-sm font-semibold mb-3">{t('habits.templates')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {HABIT_TEMPLATES.map((tpl) => {
          const Icon = (Icons as any)[tpl.icon] || Icons.Target;
          return (
            <button
              key={tpl.key}
              onClick={() => create(tpl.key)}
              className="flex items-center gap-2 p-2 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-left transition"
            >
              <div className="h-7 w-7 rounded-lg gradient-soft flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-medium truncate">
                {lang === 'bn' ? tpl.name_bn : tpl.name_en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}