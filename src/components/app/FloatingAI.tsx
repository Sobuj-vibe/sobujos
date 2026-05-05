import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="AI Assistant"
        className="fixed right-4 z-40 tap shadow-elevated rounded-full h-14 w-14 flex items-center justify-center gradient-primary text-primary-foreground"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> {t('ai.title')}
            </SheetTitle>
          </SheetHeader>
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto h-16 w-16 rounded-2xl gradient-soft flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{t('ai.soon')}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('ai.soonSub')}</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
