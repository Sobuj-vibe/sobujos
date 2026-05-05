import { useEffect, useState } from 'react';
import { AppBar } from '@/components/app/AppBar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeMode, ThemeColor } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sun, Moon, Cloud, LogOut, Camera, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useTimezone } from '@/contexts/TimezoneContext';
import { COMMON_TIMEZONES, detectBrowserTimezone, todayInTz } from '@/lib/datetime';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const APP_VERSION = '0.1.0';

const themes: { id: ThemeMode; icon: any; key: string }[] = [
  { id: 'light', icon: Sun, key: 'light' },
  { id: 'dim', icon: Cloud, key: 'dim' },
  { id: 'dark', icon: Moon, key: 'dark' },
];
const colors: ThemeColor[] = ['indigo', 'teal', 'rose', 'emerald', 'amber'];
const colorBg: Record<ThemeColor, string> = {
  indigo: 'bg-indigo-500', teal: 'bg-teal-500', rose: 'bg-rose-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { theme, setTheme, color, setColor } = useTheme();
  const { timezone, setTimezone } = useTimezone();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, location, avatar_url').eq('id', user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? '');
      setLocation(data?.location ?? '');
      setAvatarUrl(data?.avatar_url ?? null);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() || null, location: location.trim() || null }).eq('id', user.id);
    setSaving(false);
    if (error) toast.error(t('profile.saveFailed')); else toast.success(t('profile.saved'));
  };

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_lang', lng);
    if (user) supabase.from('profiles').update({ language: lng }).eq('id', user.id).then();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setAvatarUrl(url);
    setUploading(false);
    toast.success(t('profile.saved'));
  };

  const logout = async () => {
    await signOut();
    toast.success(t('auth.signedOut'));
    nav('/auth/login', { replace: true });
  };

  const initials = (displayName || user?.email || '?').slice(0, 2).toUpperCase();

  const browserTz = detectBrowserTimezone();
  // Build options: current + browser tz + curated list (deduped).
  const tzOptions = (() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];
    const push = (v: string, l: string) => {
      if (!v || seen.has(v)) return;
      seen.add(v);
      list.push({ value: v, label: l });
    };
    push(browserTz, `${browserTz} (${t('profile.deviceTimezone')})`);
    if (timezone && timezone !== browserTz) push(timezone, timezone);
    for (const o of COMMON_TIMEZONES) push(o.value, o.label);
    return list;
  })();

  return (
    <div>
      <AppBar title={t('profile.title')} />
      <div className="pt-appbar md:pt-0 px-4 md:px-0 pb-4 space-y-6 md:max-w-2xl">
        <h1 className="hidden md:block text-2xl font-bold">{t('profile.title')}</h1>

        {/* Account card */}
        <section className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">{t('profile.account')}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg gradient-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-soft tap">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('profile.displayName')}</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('profile.location')}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('profile.locationPlaceholder')} maxLength={120} />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">{t('common.save')}</Button>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">{t('profile.appearance')}</h2>
          <div className="space-y-2">
            <Label>{t('profile.theme')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ id, icon: Icon, key }) => (
                <button key={id} onClick={() => setTheme(id)}
                  className={cn('h-16 rounded-xl border flex flex-col items-center justify-center gap-1 tap',
                    theme === id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{t(`profile.${key}`)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('profile.themeColor')}</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('h-10 w-10 rounded-full tap', colorBg[c],
                    color === c && 'ring-2 ring-offset-2 ring-foreground/40 ring-offset-background')} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('profile.language')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => changeLang('bn')} className={cn('h-11 rounded-xl border tap font-medium', i18n.language === 'bn' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>বাংলা</button>
              <button onClick={() => changeLang('en')} className={cn('h-11 rounded-xl border tap font-medium', i18n.language === 'en' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>English</button>
            </div>
          </div>
        </section>

        {/* Timezone */}
        <section className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">{t('profile.timezone')}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{t('profile.timezoneHelp')}</p>
          <Select value={timezone} onValueChange={(v) => { setTimezone(v); toast.success(t('profile.saved')); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {tzOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">{t('profile.todayHere')}</span>
            <span className="text-xs font-mono tabular-nums">{todayInTz(timezone)}</span>
          </div>
          {timezone !== browserTz && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => { setTimezone(browserTz); toast.success(t('profile.saved')); }}
            >
              {t('profile.useDeviceTimezone')} · {browserTz}
            </Button>
          )}
        </section>

        {/* Install */}
        <section className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center"><Download className="h-5 w-5 text-primary-foreground" /></div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('profile.install')}</h3>
              <p className="text-xs text-muted-foreground">{t('profile.installSub')}</p>
            </div>
          </div>
          <Link to="/install"><Button variant="outline" className="w-full">{t('profile.installNow')}</Button></Link>
        </section>

        {/* About */}
        <section className="rounded-2xl bg-card border border-border p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t('profile.about')}</p>
              <p className="text-xs text-muted-foreground">{t('profile.version')} {APP_VERSION}</p>
            </div>
          </div>
        </section>

        <Button onClick={logout} variant="outline" className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />{t('profile.signOut')}
        </Button>
      </div>
    </div>
  );
}
