import { AppBar } from '@/components/app/AppBar';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Placeholder({ titleKey }: { titleKey: 'nav.prayer' | 'nav.finance' }) {
  const { t } = useTranslation();
  return (
    <div>
      <AppBar title={t(titleKey)} />
      <div className="pt-appbar md:pt-0 px-4 md:px-0 pb-4">
        <div className="rounded-2xl gradient-soft border border-border p-10 text-center space-y-3 mt-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-card flex items-center justify-center shadow-soft">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{t('ai.soon')}</h2>
            <p className="text-sm text-muted-foreground mt-1">This module will be built next.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
