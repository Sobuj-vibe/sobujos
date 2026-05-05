import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import { LangSwitch } from '@/components/app/LangSwitch';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message.includes('email') ? t('auth.invalidEmail') : t('auth.passwordMin'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    nav('/app/tasks', { replace: true });
  };

  return (
    <AuthLayout>
      <div className="flex justify-end"><LangSwitch /></div>
      <div className="text-center space-y-2 mb-8">
        <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">{t('auth.welcome')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.welcomeSub')}</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex justify-end">
          <Link to="/auth/forgot" className="text-sm text-primary hover:underline">{t('auth.forgotPassword')}</Link>
        </div>
        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.signIn')}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.noAccount')} <Link to="/auth/signup" className="text-primary font-medium hover:underline">{t('auth.signUp')}</Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 safe-top safe-bottom">
        <div className="w-full max-w-sm gradient-soft rounded-3xl p-6 shadow-soft border border-border/50">
          {children}
        </div>
      </div>
    </div>
  );
}
