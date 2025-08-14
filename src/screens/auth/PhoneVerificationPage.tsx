import React, { useState } from 'react';
void React;
import AuthScaffold from './AuthScaffold';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { startPhoneVerification, verifyPhone, resendPhoneVerification } from '../../services/auth';
import { toast } from 'sonner';
import { useAuth } from '../../context/useAuth';

export default function PhoneVerificationPage() {
  useAuth(); // ensure auth context (could prefill phone later)
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'enter'|'code'>('enter');
  const [loading, setLoading] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await startPhoneVerification(phone.trim());
      toast.success('Code sent');
      setStep('code');
    } catch (err) {
      toast.error((err as Error).message || 'Failed');
    } finally { setLoading(false); }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      await verifyPhone(phone.trim(), code.trim());
      toast.success('Phone verified');
      // Optionally refresh user profile here
    } catch (err) {
      toast.error((err as Error).message || 'Verification failed');
    } finally { setLoading(false); }
  }

  async function resend() {
    try {
      await resendPhoneVerification(phone.trim());
      toast.success('Code resent');
    } catch (err) {
      toast.error((err as Error).message || 'Resend failed');
    }
  }

  return (
    <AuthScaffold subtitle="Verify your phone number.">
      <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] border border-[color:var(--owl-border)] shadow-[var(--owl-shadow-md)]">
        <CardHeader><CardTitle>Phone Verification</CardTitle></CardHeader>
        <CardContent>
          {step === 'enter' && (
            <form onSubmit={start} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" placeholder="+1 555 555 5555" value={phone} onChange={e=>setPhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</Button>
            </form>
          )}
          {step === 'code' && (
            <form onSubmit={submitCode} className="space-y-4">
              <p className="text-xs text-[color:var(--owl-text-secondary)]">We sent a code to {phone}</p>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={code} onChange={e=>setCode(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify phone'}</Button>
              <button type="button" onClick={resend} className="text-xs text-[color:var(--owl-accent)] hover:underline">Resend code</button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
