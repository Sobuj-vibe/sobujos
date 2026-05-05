import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  title: string;
  back?: boolean;
  right?: ReactNode;
  subtitle?: string;
};

export function AppBar({ title, back, right, subtitle }: Props) {
  const nav = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-background/85 backdrop-blur-lg border-b border-border safe-top">
      <div className="max-w-md mx-auto h-14 px-3 flex items-center gap-2">
        {back && (
          <button onClick={() => nav(-1)} className="p-2 -ml-2 rounded-full tap hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-base truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
