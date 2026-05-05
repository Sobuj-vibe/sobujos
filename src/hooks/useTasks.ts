import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TaskGroup = { id: string; name: string; color: string; icon: string; position: number };
export type Task = { id: string; group_id: string; title: string; notes: string | null; due_date: string | null; priority: 'low' | 'medium' | 'high'; completed_at: string | null; position: number };
export type Subtask = { id: string; task_id: string; title: string; completed_at: string | null; position: number };

export function useTaskGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from('task_groups').select('*').eq('user_id', user.id).order('position').order('created_at');
    setGroups((data as TaskGroup[]) || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  return { groups, loading, refresh };
}

export function useTasks(groupId?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    let q = supabase.from('tasks').select('*').eq('user_id', user.id);
    if (groupId) q = q.eq('group_id', groupId);
    const { data } = await q.order('due_date', { ascending: true, nullsFirst: false }).order('created_at');
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user, groupId]);

  return { tasks, loading, refresh };
}

export function useSubtasks(taskId: string | null) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const refresh = async () => {
    if (!taskId) { setSubtasks([]); return; }
    const { data } = await supabase.from('subtasks').select('*').eq('task_id', taskId).order('position').order('created_at');
    setSubtasks((data as Subtask[]) || []);
  };
  useEffect(() => { refresh(); }, [taskId]);
  return { subtasks, refresh };
}
