import React, { useState } from 'react';
void React; // ensure React in scope for tests using classic runtime
import { useNavigate } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { verifyEmail, resendVerification } from '../../services/auth';
import { useAuth } from '../../context/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [editableEmail, setEditableEmail] = useState(user?.email || '');
  const [editingEmail, setEditingEmail] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
  const finalEmail = editableEmail.trim();
  if (!finalEmail) throw new Error('Missing email');
  await verifyEmail(finalEmail, code.trim());
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
    const finalEmail = editableEmail.trim();
    if (!finalEmail) return toast.error('Missing email');
    setResending(true);
    try {
      await resendVerification(finalEmail);
      toast.success('Code resent');
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || 'Resend failed');
    } finally {
      setResending(false);
    }
  }

  const verified = !!(user?.emailVerified || user?.phoneVerified);
  if (verified) {
    return (
      <AuthScaffold subtitle="You're verified">
        <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)]">
          <CardHeader><CardTitle>Email Verified</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm mb-4">Proceed to identity verification to finish onboarding.</p>
            <Button onClick={()=>navigate('/auth/kyc',{replace:true})} className="w-full">Continue to KYC</Button>
          </CardContent>
        </Card>
      </AuthScaffold>
    );
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
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2 items-start">
                <Input id="email" type="email" disabled={!editingEmail} value={editableEmail} onChange={(e)=>setEditableEmail(e.target.value)} className="flex-1" />
                <button type="button" onClick={()=> setEditingEmail(e=>!e)} className="text-xs text-[color:var(--owl-accent)] hover:underline mt-2">{editingEmail ? 'Lock' : 'Edit'}</button>
              </div>
              <p className="text-xs text-[color:var(--owl-text-secondary)]">If you entered the wrong email you can update it before verification.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="code">6-digit code</Label>
              <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={code.length>0 && code.length!==6 ? 'true' : undefined} />
              <p className="text-xs text-[color:var(--owl-text-secondary)]">Enter the code we sent to your email.</p>
            </div>
            <Button type="submit" disabled={submitting || code.length !== 6} className="w-full">{submitting ? 'Verifying…' : 'Verify code'}</Button>
            <button onClick={resend} type="button" className="block w-full text-center text-sm text-[color:var(--owl-accent)] hover:underline disabled:opacity-50" disabled={resending}>{resending ? 'Resending…' : 'Resend code'}</button>
            <button type="button" onClick={()=>navigate('/auth/register')} className="block w-full text-center text-xs text-[color:var(--owl-text-secondary)] hover:underline">Back to registration</button>
            <Link to="/auth/verify-phone" state={{ from: location?.state?.from || '/auth/kyc' }} className="block w-full text-center text-xs text-[color:var(--owl-accent)] hover:underline">Verify by phone instead</Link>
          </form>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
