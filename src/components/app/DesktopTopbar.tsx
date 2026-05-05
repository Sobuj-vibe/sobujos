import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePageTitleContext } from '@/contexts/PageTitleContext';
import { LangSwitch } from './LangSwitch';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { Sun, Moon, Cloud, User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const order: ThemeMode[] = ['light', 'dim', 'dark'];
const themeIcon = { light: Sun, dim: Cloud, dark: Moon } as const;

export function DesktopTopbar() {
  const { title, subtitle } = usePageTitleContext();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  const Icon = themeIcon[theme];
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? '');
        setAvatarUrl(data?.avatar_url ?? null);
      });
  }, [user]);

  const cycleTheme = () => {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.signedOut'));
    nav('/auth/login', { replace: true });
  };

  const initials = (displayName || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-background/85 backdrop-blur-lg sticky top-0 z-30 flex items-center px-4 gap-3">
      <SidebarTrigger className="h-9 w-9" />
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-base truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={cycleTheme}
          aria-label={t('profile.theme')}
          className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center tap text-muted-foreground"
        >
          <Icon className="h-4 w-4" />
        </button>
        <LangSwitch />
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 rounded-full tap focus:outline-none focus:ring-2 focus:ring-ring">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs gradient-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{displayName || t('profile.title')}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav('/app/profile')}>
              <User className="h-4 w-4 mr-2" />
              {t('profile.title')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              {t('profile.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}