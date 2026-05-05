import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DesktopTopbar } from './DesktopTopbar';
import { FloatingAI } from './FloatingAI';

export function DesktopShell() {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DesktopTopbar />
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>
        <FloatingAI />
      </div>
    </SidebarProvider>
  );
}