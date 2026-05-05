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
import { AuthLayout } from './Login';
import { LangSwitch } from '@/components/app/LangSwitch';

const schema = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Signup() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ displayName: displayName.trim(), email: email.trim(), password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/tasks`,
        data: { display_name: displayName.trim() },
      },
    });
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
        <h1 className="text-2xl font-bold">{t('auth.signupTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.signupSub')}</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('auth.displayName')}</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.signUp')}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.hasAccount')} <Link to="/auth/login" className="text-primary font-medium hover:underline">{t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  );
}
