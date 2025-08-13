import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { apiVerifyEmail, apiResendVerification } from '../../lib/api';
import { useAuth } from '../../context/useAuth';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      await apiVerifyEmail(code.trim());
      toast.success('Email verified');
      navigate('/auth/kyc', { replace: true });
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function resend(e: React.MouseEvent) {
    e.preventDefault();
    if (!user?.email) return toast.error('Missing email');
    setResending(true);
    try {
      await apiResendVerification(user.email);
      toast.success('Code resent');
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || 'Resend failed');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScaffold subtitle="Check your email for a verification code.">
      <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)]">
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="code">6-digit code</Label>
              <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={code.length>0 && code.length!==6 ? 'true' : undefined} />
              <p className="text-xs text-[color:var(--owl-text-secondary)]">Enter the code we sent to your email.</p>
            </div>
            <Button type="submit" disabled={submitting || code.length !== 6} className="w-full">{submitting ? 'Verifying…' : 'Verify code'}</Button>
            <button onClick={resend} type="button" className="block w-full text-center text-sm text-[color:var(--owl-accent)] hover:underline disabled:opacity-50" disabled={resending}>{resending ? 'Resending…' : 'Resend code'}</button>
          </form>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
