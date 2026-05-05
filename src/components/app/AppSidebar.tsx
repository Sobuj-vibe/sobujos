import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, Moon, Wallet, User, Sparkles, Sun, Cloud, LogOut, Languages, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { to: '/app/tasks', icon: CheckSquare, key: 'tasks' as const },
  { to: '/app/prayer', icon: Moon, key: 'prayer' as const },
  { to: '/app/finance', icon: Wallet, key: 'finance' as const },
  { to: '/app/habits', icon: Target, key: 'habits' as const },
  { to: '/app/profile', icon: User, key: 'profile' as const },
];

const themeOptions = [
  { id: 'light' as const, icon: Sun, key: 'light' },
  { id: 'dim' as const, icon: Cloud, key: 'dim' },
  { id: 'dark' as const, icon: Moon, key: 'dark' },
];

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const nav = useNavigate();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const changeLang = (l: string) => {
    i18n.changeLanguage(l);
    localStorage.setItem('app_lang', l);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.signedOut'));
    nav('/auth/login', { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{t('app.name')}</p>
              <p className="text-[11px] text-muted-foreground truncate">{t('app.tagline')}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{t('nav.tasks')}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to)}
                    tooltip={t(`nav.${item.key}`)}
                  >
                    <NavLink to={item.to} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{t('profile.appearance')}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {themeOptions.map(({ id, icon: Icon, key }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    onClick={() => setTheme(id)}
                    isActive={theme === id}
                    tooltip={t(`profile.${key}`)}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{t(`profile.${key}`)}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip={t('profile.language')}>
                      <Languages className="h-4 w-4" />
                      {!collapsed && (
                        <span className="flex-1 text-left">
                          {i18n.language === 'bn' ? 'বাংলা' : 'English'}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="right">
                    <DropdownMenuItem onClick={() => changeLang('bn')}>বাংলা</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLang('en')}>English</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={t('profile.signOut')}
              className={cn('text-destructive hover:text-destructive')}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>{t('profile.signOut')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}