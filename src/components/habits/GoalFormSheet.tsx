import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Goal, GoalType, GOAL_CATEGORIES, useGoals } from '@/hooks/useGoals';
import { useTimezone } from '@/contexts/TimezoneContext';
import { todayInTz } from '@/lib/datetime';

export function GoalFormSheet({
  open, onOpenChange, goal,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  goal?: Goal | null;
}) {
  const { t } = useTranslation();
  const { add, update, remove } = useGoals();
  const { timezone } = useTimezone();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [type, setType] = useState<GoalType>('outcome');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [start, setStart] = useState(() => todayInTz(timezone));
  const [deadline, setDeadline] = useState('');
  const [weeklyReview, setWeeklyReview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (goal) {
        setTitle(goal.title);
        setDescription(goal.description || '');
        setCategory(goal.category);
        setType(goal.type);
        setTarget(goal.target_value?.toString() || '');
        setUnit(goal.target_unit || '');
        setStart(goal.start_date);
        setDeadline(goal.deadline || '');
        setWeeklyReview(goal.weekly_review);
      } else {
        setTitle(''); setDescription(''); setCategory('personal'); setType('outcome');
        setTarget(''); setUnit(''); setStart(todayInTz(timezone));
        setDeadline(''); setWeeklyReview(false);
      }
    }
  }, [open, goal]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        type,
        target_value: target ? Number(target) : null,
        target_unit: unit.trim() || null,
        start_date: start,
        deadline: deadline || null,
        weekly_review: weeklyReview,
      };
      if (goal) await update(goal.id, payload);
      else await add(payload);
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!goal || !confirm(t('habits.deleteGoalConfirm'))) return;
    await remove(goal.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{goal ? t('habits.editGoal') : t('habits.newGoal')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium">{t('habits.goalTitle')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('habits.goalTitlePh')} />
          </div>
          <div>
            <label className="text-xs font-medium">{t('habits.description')}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">{t('habits.category')}</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`habits.categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">{t('habits.goalType')}</label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outcome">{t('habits.goalTypes.outcome')}</SelectItem>
                  <SelectItem value="process">{t('habits.goalTypes.process')}</SelectItem>
                  <SelectItem value="project">{t('habits.goalTypes.project')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">{t('habits.targetValue')}</label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className="text-xs font-medium">{t('habits.targetUnit')}</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="books, kg, BDT..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">{t('habits.startDate')}</label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">{t('habits.deadline')}</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={weeklyReview} onChange={(e) => setWeeklyReview(e.target.checked)} />
            {t('habits.weeklyReview')}
          </label>
          <div className="flex gap-2 pt-2">
            {goal && (
              <Button variant="outline" onClick={del} className="text-destructive">{t('common.delete')}</Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">{t('common.cancel')}</Button>
            <Button onClick={save} disabled={saving || !title.trim()} className="flex-1 gradient-primary text-primary-foreground">
              {t('common.save')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}