import { NavLink } from 'react-router-dom';
import { CheckSquare, Moon, Wallet, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/app/tasks', icon: CheckSquare, key: 'tasks' as const },
  { to: '/app/prayer', icon: Moon, key: 'prayer' as const },
  { to: '/app/finance', icon: Wallet, key: 'finance' as const },
  { to: '/app/profile', icon: User, key: 'profile' as const },
];

export function BottomTabs() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom shadow-elevated">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-2 pb-2">
        {tabs.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 px-1 rounded-xl tap',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('p-1.5 rounded-lg transition-colors', isActive && 'bg-primary/10')}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn('text-[11px] font-medium', isActive && 'font-semibold')}>{t(`nav.${key}`)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
