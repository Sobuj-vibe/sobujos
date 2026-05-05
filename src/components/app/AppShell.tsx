import { Outlet } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { FloatingAI } from './FloatingAI';
import { DesktopShell } from './DesktopShell';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageTitleProvider } from '@/contexts/PageTitleContext';

function MobileShell() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <main className="flex-1 pb-tabbar">
          <Outlet />
        </main>
      </div>
      <FloatingAI />
      <BottomTabs />
    </div>
  );
}

export function AppShell() {
  const isMobile = useIsMobile();
  return (
    <PageTitleProvider>
      {isMobile ? <MobileShell /> : <DesktopShell />}
    </PageTitleProvider>
  );
}
