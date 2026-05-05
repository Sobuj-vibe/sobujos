import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimezone } from '@/contexts/TimezoneContext';
import { isoDateInTz } from '@/lib/datetime';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerStatus = 'on_time' | 'late' | 'qaza';
export const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type PrayerLog = {
  id: string;
  date: string;
  prayer: PrayerName;
  status: PrayerStatus;
  made_up_at: string | null;
};

export type QuranLog = {
  id: string;
  date: string;
  surah_number: number;
  surah_name: string;
  ayat_from: number;
  ayat_to: number | null;
  note: string | null;
  created_at: string;
};

/** @deprecated Use `isoDateInTz` from `@/lib/datetime`. */
export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function emit() {
  window.dispatchEvent(new Event('ai-data-changed'));
}

export function usePrayerLogs(daysBack = 90) {
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const [logs, setLogs] = useState<PrayerLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const from = new Date();
    from.setDate(from.getDate() - daysBack);
    const { data } = await supabase
      .from('prayer_logs')
      .select('id,date,prayer,status,made_up_at')
      .eq('user_id', user.id)
      .gte('date', isoDateInTz(from, timezone))
      .order('date', { ascending: false });
    setLogs((data as PrayerLog[]) || []);
    setLoading(false);
  }, [user, daysBack, timezone]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const upsertPrayer = async (date: string, prayer: PrayerName, status: PrayerStatus) => {
    if (!user) return;
    await supabase.from('prayer_logs').upsert(
      { user_id: user.id, date, prayer, status, made_up_at: null },
      { onConflict: 'user_id,date,prayer' },
    );
    await refresh();
    emit();
  };

  const markMadeUp = async (id: string) => {
    await supabase.from('prayer_logs').update({ made_up_at: new Date().toISOString() }).eq('id', id);
    await refresh();
    emit();
  };

  return { logs, loading, refresh, upsertPrayer, markMadeUp };
}

export function useQuranLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<QuranLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('quran_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    setLogs((data as QuranLog[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (entry: Omit<QuranLog, 'id' | 'created_at'>) => {
    if (!user) return;
    await supabase.from('quran_logs').insert({ ...entry, user_id: user.id });
    await refresh();
    emit();
  };

  const remove = async (id: string) => {
    await supabase.from('quran_logs').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { logs, loading, refresh, add, remove };
}

export type TasbihCounter = { id: string; name: string; count: number; target: number };

export function useTasbih() {
  const { user } = useAuth();
  const [items, setItems] = useState<TasbihCounter[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tasbih_counters').select('id,name,count,target')
      .eq('user_id', user.id).order('created_at');
    setItems((data as TasbihCounter[]) || []);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (name: string, target: number) => {
    if (!user) return;
    await supabase.from('tasbih_counters').insert({ user_id: user.id, name, target, count: 0 });
    refresh();
  };
  const inc = async (it: TasbihCounter) => {
    await supabase.from('tasbih_counters').update({ count: it.count + 1 }).eq('id', it.id);
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, count: x.count + 1 } : x)));
  };
  const reset = async (it: TasbihCounter) => {
    await supabase.from('tasbih_counters').update({ count: 0 }).eq('id', it.id);
    refresh();
  };
  const remove = async (id: string) => {
    await supabase.from('tasbih_counters').delete().eq('id', id);
    refresh();
  };
  return { items, add, inc, reset, remove };
}