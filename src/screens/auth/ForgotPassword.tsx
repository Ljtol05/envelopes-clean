import React, { useState } from 'react'; void React;
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { PasswordField } from '../../components/ui/password-field';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { forgotPassword, resetPassword } from '../../services/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email required'); return; }
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || 'If an account exists for that email, a reset code has been sent.');
      setStep('reset');
    } catch {
      // Fall back to generic success to avoid enumeration
      setMessage('If an account exists for that email, a reset code has been sent.');
      setStep('reset');
    } finally { setLoading(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) { setError('Enter the 6-digit code'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await resetPassword(email.trim(), code.trim(), newPassword);
      setMessage(res.message || 'Password reset successfully.');
      toast.success('Password reset');
      setStep('done');
    } catch (err) {
      // Attempt to surface server message while preventing leakage of existence data.
      let msg: string | undefined;
      if (typeof err === 'object' && err && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: string } } }).response;
        msg = resp?.data?.message;
      }
      if (!msg && err instanceof Error) msg = err.message;
      setError(msg || 'Reset failed');
    } finally { setLoading(false); }
  }

  if (step === 'done') {
    return (
      <div>
        <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)]">
          <CardHeader><CardTitle>Password Reset</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{message || 'Your password has been reset.'}</p>
            <Button className="w-full" onClick={() => navigate('/auth/login', { replace: true })}>Return to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)]">
        <CardHeader>
          <CardTitle>{step === 'email' ? 'Reset password' : 'Enter reset code'}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmail} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error ? 'true' : undefined} />
              </div>
              {message && <p className="text-xs text-green-500">{message}</p>}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending…' : 'Send code'}</Button>
              <button type="button" onClick={()=>navigate('/auth/login')} className="block w-full text-center text-xs text-[color:var(--owl-text-secondary)] hover:underline">Back to login</button>
            </form>
          )}
          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-xs text-[color:var(--owl-text-secondary)]">We sent a 6‑digit code to {email}</p>
              <div className="space-y-1">
                <Label htmlFor="code">Code</Label>
                <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={error?.toLowerCase().includes('code') ? 'true' : undefined} />
              </div>
              <PasswordField id="newPassword" label="New password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} errorMessage={error?.toLowerCase().includes('password') ? error : undefined} errorId="newPassword-error" />
              <PasswordField id="confirmPassword" label="Confirm new password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} errorMessage={error?.toLowerCase().includes('match') ? error : undefined} errorId="confirmPassword-error" />
              {message && <p className="text-xs text-green-500">{message}</p>}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Resetting…' : 'Reset password'}</Button>
                <div className="flex justify-between items-center">
                  <button type="button" className="text-xs text-[color:var(--owl-accent)] hover:underline" disabled={loading} onClick={() => { setStep('email'); setCode(''); setNewPassword(''); setConfirmPassword(''); setError(null); }}>Back</button>
                  <button type="button" className="text-xs text-[color:var(--owl-text-secondary)] hover:underline" disabled={loading} onClick={()=>navigate('/auth/login')}>Back to login</button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
