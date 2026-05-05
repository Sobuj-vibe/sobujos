import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { detectBrowserTimezone } from '@/lib/datetime';

type TimezoneCtx = {
  timezone: string;
  setTimezone: (tz: string) => Promise<void>;
  loading: boolean;
};

const Ctx = createContext<TimezoneCtx>({
  timezone: 'UTC',
  setTimezone: async () => {},
  loading: true,
});

const LS_KEY = 'app_timezone';

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [timezone, setTz] = useState<string>(() => {
    if (typeof window === 'undefined') return 'UTC';
    return localStorage.getItem(LS_KEY) || detectBrowserTimezone();
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const tz = data?.timezone && data.timezone !== 'UTC' ? data.timezone : null;
        if (tz) {
          setTz(tz);
          localStorage.setItem(LS_KEY, tz);
        } else {
          // No saved tz (or default UTC) → use browser tz and persist it.
          const detected = detectBrowserTimezone();
          setTz(detected);
          localStorage.setItem(LS_KEY, detected);
          if (detected !== 'UTC') {
            supabase.from('profiles').update({ timezone: detected }).eq('id', user.id).then();
          }
        }
        setLoading(false);
      });
  }, [user]);

  const setTimezone = useCallback(
    async (tz: string) => {
      setTz(tz);
      localStorage.setItem(LS_KEY, tz);
      if (user) {
        await supabase.from('profiles').update({ timezone: tz }).eq('id', user.id);
      }
    },
    [user]
  );

  return <Ctx.Provider value={{ timezone, setTimezone, loading }}>{children}</Ctx.Provider>;
}

export const useTimezone = () => useContext(Ctx);
