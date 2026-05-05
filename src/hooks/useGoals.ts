import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GoalType = 'outcome' | 'process' | 'project';
export type GoalStatus = 'active' | 'completed' | 'archived';

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: GoalType;
  target_value: number | null;
  target_unit: string | null;
  current_value: number;
  start_date: string;
  deadline: string | null;
  status: GoalStatus;
  finance_category_id: string | null;
  weekly_review: boolean;
  created_at: string;
  completed_at: string | null;
};

export type Milestone = {
  id: string;
  goal_id: string;
  title: string;
  target_date: string | null;
  position: number;
  completed_at: string | null;
};

export type GoalNote = {
  id: string;
  goal_id: string;
  body: string;
  created_at: string;
};

function emit() {
  window.dispatchEvent(new Event('ai-data-changed'));
}

export function useGoals() {
  const { user } = useAuth();
  const [items, setItems] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems(((data as any[]) || []).map((d) => ({
      ...d,
      target_value: d.target_value === null ? null : Number(d.target_value),
      current_value: Number(d.current_value),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (g: Partial<Goal> & { title: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: user.id, ...g })
      .select().single();
    if (error) throw error;
    await refresh();
    emit();
    return data as Goal;
  };

  const update = async (id: string, patch: Partial<Goal>) => {
    await supabase.from('goals').update(patch).eq('id', id);
    await refresh();
    emit();
  };

  const remove = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { items, loading, add, update, remove, refresh };
}

export function useMilestones(goalId: string | null) {
  const { user } = useAuth();
  const [items, setItems] = useState<Milestone[]>([]);

  const refresh = useCallback(async () => {
    if (!user || !goalId) { setItems([]); return; }
    const { data } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('user_id', user.id)
      .eq('goal_id', goalId)
      .order('position');
    setItems((data as Milestone[]) || []);
  }, [user, goalId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (title: string, target_date: string | null = null) => {
    if (!user || !goalId) return;
    const pos = items.length;
    await supabase.from('goal_milestones').insert({
      user_id: user.id,
      goal_id: goalId,
      title,
      target_date,
      position: pos,
    });
    await refresh();
    emit();
  };

  const toggle = async (id: string) => {
    const m = items.find((x) => x.id === id);
    if (!m) return;
    await supabase.from('goal_milestones')
      .update({ completed_at: m.completed_at ? null : new Date().toISOString() })
      .eq('id', id);
    await refresh();
    emit();
  };

  const remove = async (id: string) => {
    await supabase.from('goal_milestones').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { items, add, toggle, remove, refresh };
}

export function useAllMilestones() {
  const { user } = useAuth();
  const [items, setItems] = useState<Milestone[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('position');
    setItems((data as Milestone[]) || []);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  return { items, refresh };
}

export function useGoalNotes(goalId: string | null) {
  const { user } = useAuth();
  const [items, setItems] = useState<GoalNote[]>([]);

  const refresh = useCallback(async () => {
    if (!user || !goalId) { setItems([]); return; }
    const { data } = await supabase
      .from('goal_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });
    setItems((data as GoalNote[]) || []);
  }, [user, goalId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (body: string) => {
    if (!user || !goalId || !body.trim()) return;
    await supabase.from('goal_notes').insert({
      user_id: user.id,
      goal_id: goalId,
      body: body.trim(),
    });
    await refresh();
  };

  const remove = async (id: string) => {
    await supabase.from('goal_notes').delete().eq('id', id);
    await refresh();
  };

  return { items, add, remove, refresh };
}

export const GOAL_CATEGORIES = [
  'health', 'career', 'learning', 'finance', 'spiritual', 'personal', 'other',
] as const;