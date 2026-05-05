import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { AuthLayout } from './Login';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) { toast.error(t('auth.invalidEmail')); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success(t('auth.resetSent'));
  };

  return (
    <AuthLayout>
      <div className="text-center space-y-2 mb-8">
        <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">{t('auth.resetTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.resetSub')}</p>
      </div>
      {sent ? (
        <p className="text-center text-sm text-muted-foreground py-4">{t('auth.resetSent')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.sendReset')}
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/auth/login" className="text-primary font-medium hover:underline">{t('auth.backToLogin')}</Link>
      </p>
    </AuthLayout>
  );
}
