import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { AuthLayout } from './Login';

export default function ResetPassword() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase handles the recovery hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t('auth.passwordMin')); return; }
    if (password !== confirm) { toast.error(t('auth.passwordsMismatch')); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('profile.saved'));
    nav('/app/tasks', { replace: true });
  };

  return (
    <AuthLayout>
      <div className="text-center space-y-2 mb-8">
        <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <Lock className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">{t('auth.setNewTitle')}</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw">{t('auth.newPassword')}</Label>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={!ready} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpw">{t('auth.confirmPassword')}</Label>
          <Input id="cpw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} disabled={!ready} />
        </div>
        <Button type="submit" className="w-full h-12" disabled={loading || !ready}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.updatePassword')}
        </Button>
      </form>
    </AuthLayout>
  );
}
