import { AppBar } from '@/components/app/AppBar';
import { useTranslation } from 'react-i18next';
import { Smartphone, Apple } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Install() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <AppBar title={t('install.title')} back />
        <div className="pt-appbar px-4 pb-8 space-y-5">
          <p className="text-sm text-muted-foreground">{t('install.sub')}</p>

          {installed && (
            <div className="rounded-2xl bg-success/10 border border-success/30 p-4 text-success text-sm">{t('install.installed')}</div>
          )}

          {deferred && !installed && (
            <Button onClick={install} className="w-full h-12">{t('profile.installNow')}</Button>
          )}

          <section className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Apple className="h-5 w-5" />{t('install.iosTitle')}</h2>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5">
              <li>{t('install.ios1')}</li>
              <li>{t('install.ios2')}</li>
              <li>{t('install.ios3')}</li>
            </ol>
          </section>

          <section className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Smartphone className="h-5 w-5" />{t('install.androidTitle')}</h2>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5">
              <li>{t('install.android1')}</li>
              <li>{t('install.android2')}</li>
              <li>{t('install.android3')}</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
