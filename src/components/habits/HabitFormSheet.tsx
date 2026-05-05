import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Habit, HabitScheduleKind, HabitTimeOfDay, HabitType, useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

const ICONS = ['Target','Sparkles','Heart','Dumbbell','BookOpen','GlassWater','Footprints','Brain','Moon','Sun','Sunrise','Sunset','NotebookPen','Languages','Coffee','Pizza','Bike','Music','Code','PenTool','FlaskConical','Leaf','Flame'];
const COLORS = ['indigo','sky','emerald','amber','rose','teal'];
const WEEKDAYS = [0,1,2,3,4,5,6]; // Sun..Sat
const WEEKDAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'] as const;

export function HabitFormSheet({
  open, onOpenChange, habit,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  habit?: Habit | null;
}) {
  const { t } = useTranslation();
  const { add, update, remove } = useHabits();
  const { items: goals } = useGoals();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('indigo');
  const [type, setType] = useState<HabitType>('boolean');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState<string>('');
  const [scheduleKind, setScheduleKind] = useState<HabitScheduleKind>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([1,2,3,4,5]);
  const [weeklyCount, setWeeklyCount] = useState<string>('5');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('anytime');
  const [reminder, setReminder] = useState<string>('');
  const [goalId, setGoalId] = useState<string>('');
  const [why, setWhy] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (habit) {
        setName(habit.name);
        setIcon(habit.icon);
        setColor(habit.color);
        setType(habit.type);
        setUnit(habit.target_unit || '');
        setTarget(habit.target_value?.toString() || '');
        setScheduleKind(habit.schedule_kind);
        setScheduleDays(habit.schedule_days || [1,2,3,4,5]);
        setWeeklyCount(habit.weekly_count?.toString() || '5');
        setTimeOfDay(habit.time_of_day);
        setReminder(habit.reminder_time || '');
        setGoalId(habit.goal_id || '');
        setWhy(habit.why || '');
      } else {
        setName(''); setIcon('Target'); setColor('indigo'); setType('boolean');
        setUnit(''); setTarget(''); setScheduleKind('daily'); setScheduleDays([1,2,3,4,5]);
        setWeeklyCount('5'); setTimeOfDay('anytime'); setReminder(''); setGoalId(''); setWhy('');
      }
    }
  }, [open, habit]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        icon, color, type,
        target_unit: type === 'boolean' ? null : (unit || null),
        target_value: type === 'boolean' ? null : (target ? Number(target) : null),
        schedule_kind: scheduleKind,
        schedule_days: scheduleKind === 'weekdays' ? scheduleDays : null,
        weekly_count: scheduleKind === 'weekly_count' ? Number(weeklyCount) : null,
        time_of_day: timeOfDay,
        reminder_time: reminder || null,
        goal_id: goalId || null,
        why: why.trim() || null,
      };
      if (habit) await update(habit.id, payload);
      else await add(payload);
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!habit) return;
    if (!confirm(t('habits.deleteConfirm'))) return;
    await remove(habit.id);
    onOpenChange(false);
  };

  const toggleDay = (d: number) => {
    setScheduleDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{habit ? t('habits.editHabit') : t('habits.newHabit')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium">{t('habits.name')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('habits.namePh')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">{t('habits.color')}</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2',
                      color === c ? 'border-foreground' : 'border-transparent',
                    )}
                    style={{ backgroundColor: `hsl(var(--${c === 'indigo' ? 'primary' : c === 'rose' ? 'destructive' : c === 'emerald' ? 'success' : 'primary'}))` }}
                    title={c}
                  >
                    <span className="block h-full w-full rounded-full" style={{
                      background: c === 'sky' ? '#0ea5e9'
                        : c === 'emerald' ? '#10b981'
                        : c === 'amber' ? '#f59e0b'
                        : c === 'rose' ? '#f43f5e'
                        : c === 'teal' ? '#14b8a6'
                        : 'hsl(var(--primary))',
                    }} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">{t('habits.icon')}</label>
              <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border',
                      icon === i ? 'border-primary bg-primary/10' : 'border-border',
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">{t('habits.type')}</label>
            <Select value={type} onValueChange={(v) => setType(v as HabitType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">{t('habits.types.boolean')}</SelectItem>
                <SelectItem value="counter">{t('habits.types.counter')}</SelectItem>
                <SelectItem value="duration">{t('habits.types.duration')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type !== 'boolean' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">{t('habits.targetValue')}</label>
                <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="8" />
              </div>
              <div>
                <label className="text-xs font-medium">{t('habits.targetUnit')}</label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={type === 'duration' ? 'minutes' : 'glasses'} />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium">{t('habits.schedule')}</label>
            <Select value={scheduleKind} onValueChange={(v) => setScheduleKind(v as HabitScheduleKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('habits.scheduleKinds.daily')}</SelectItem>
                <SelectItem value="weekdays">{t('habits.scheduleKinds.weekdays')}</SelectItem>
                <SelectItem value="weekly_count">{t('habits.scheduleKinds.weekly_count')}</SelectItem>
              </SelectContent>
            </Select>
            {scheduleKind === 'weekdays' && (
              <div className="flex gap-1 mt-2">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={cn(
                      'h-8 w-8 rounded-full text-xs font-medium',
                      scheduleDays.includes(d) ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {t(`habits.weekdays.${WEEKDAY_KEYS[d]}`)}
                  </button>
                ))}
              </div>
            )}
            {scheduleKind === 'weekly_count' && (
              <div className="mt-2">
                <label className="text-xs text-muted-foreground">{t('habits.weeklyCount')}</label>
                <Input type="number" min="1" max="7" value={weeklyCount} onChange={(e) => setWeeklyCount(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium">{t('habits.timeOfDay')}</label>
            <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as HabitTimeOfDay)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">{t('habits.timeOfDays.morning')}</SelectItem>
                <SelectItem value="afternoon">{t('habits.timeOfDays.afternoon')}</SelectItem>
                <SelectItem value="evening">{t('habits.timeOfDays.evening')}</SelectItem>
                <SelectItem value="anytime">{t('habits.timeOfDays.anytime')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium">{t('habits.reminder')}</label>
            <Input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} />
          </div>

          {goals.length > 0 && (
            <div>
              <label className="text-xs font-medium">{t('habits.linkGoal')}</label>
              <Select value={goalId || 'none'} onValueChange={(v) => setGoalId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.none')}</SelectItem>
                  {goals.filter((g) => g.status === 'active').map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium">{t('habits.why')}</label>
            <Textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder={t('habits.whyPh')} rows={2} />
          </div>

          <div className="flex gap-2 pt-2">
            {habit && (
              <Button variant="outline" onClick={del} className="text-destructive">{t('common.delete')}</Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">{t('common.cancel')}</Button>
            <Button onClick={save} disabled={saving || !name.trim()} className="flex-1 gradient-primary text-primary-foreground">
              {t('common.save')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}