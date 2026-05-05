import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export type ThemeMode = 'light' | 'dim' | 'dark';
export type ThemeColor = 'indigo' | 'teal' | 'rose' | 'emerald' | 'amber';

type Ctx = {
  theme: ThemeMode;
  color: ThemeColor;
  setTheme: (t: ThemeMode) => void;
  setColor: (c: ThemeColor) => void;
};

const ThemeCtx = createContext<Ctx>({ theme: 'light', color: 'indigo', setTheme: () => {}, setColor: () => {} });

const applyTheme = (theme: ThemeMode, color: ThemeColor) => {
  const root = document.documentElement;
  root.classList.remove('dim', 'dark');
  if (theme === 'dim') root.classList.add('dim');
  if (theme === 'dark') root.classList.add('dark');
  if (color === 'indigo') root.removeAttribute('data-color');
  else root.setAttribute('data-color', color);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem('app_theme') as ThemeMode) || 'light');
  const [color, setColorState] = useState<ThemeColor>(() => (localStorage.getItem('app_color') as ThemeColor) || 'indigo');

  useEffect(() => { applyTheme(theme, color); }, [theme, color]);

  // Sync from profile when user signs in
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('theme, theme_color, language').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      if (data.theme) { setThemeState(data.theme as ThemeMode); localStorage.setItem('app_theme', data.theme); }
      if (data.theme_color) { setColorState(data.theme_color as ThemeColor); localStorage.setItem('app_color', data.theme_color); }
      if (data.language && data.language !== i18n.language) i18n.changeLanguage(data.language);
    });
  }, [user, i18n]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem('app_theme', t);
    if (user) supabase.from('profiles').update({ theme: t }).eq('id', user.id).then();
  };
  const setColor = (c: ThemeColor) => {
    setColorState(c);
    localStorage.setItem('app_color', c);
    if (user) supabase.from('profiles').update({ theme_color: c }).eq('id', user.id).then();
  };

  return <ThemeCtx.Provider value={{ theme, color, setTheme, setColor }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
