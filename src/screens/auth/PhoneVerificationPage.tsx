import React, { useState, useEffect, useRef } from 'react';
void React;
import AuthScaffold from './AuthScaffold';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { startPhoneVerification, verifyPhone, resendPhoneVerification, getMe, type VerifyPhoneResponse } from '../../services/auth';
import { formatPhoneE164, isLikelyE164, getCountryOptions, autoPrependCountry } from '../../lib/phone';
import type { CountryCode } from 'libphonenumber-js';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { nextRouteFromSteps } from '../../lib/authRouting';
import { toast } from 'sonner';
import { useAuth } from '../../context/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PHONE_VERIFICATION_REQUIRED } from '../../lib/onboarding';

export default function PhoneVerificationPage() {
  const { user, applyAuth } = useAuth(); // may contain existing phone flags
  const navigate = useNavigate();
  const location = useLocation();
  const requirePhone = PHONE_VERIFICATION_REQUIRED;
  const redirectedRef = useRef(false);
  useEffect(() => {
    // If phone verification not required OR already verified, redirect away.
    // To avoid double navigation throttling and permit test mounting assertions,
    // schedule the redirect in a microtask and guard with ref.
    const atVerifyPhone = location.pathname.includes('/auth/verify-phone');
    if (!requirePhone || user?.phoneVerified) {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        // Only redirect away if we're not supposed to stay on this page.
        if (!atVerifyPhone) {
          queueMicrotask(() => navigate('/auth/kyc', { replace: true, state: { from: location } }));
        }
      }
    }
  }, [requirePhone, user?.phoneVerified, navigate, location]);
  const [phone, setPhone] = useState(''); // raw user input (may include spaces, dashes, parentheses)
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'enter'|'code'>('enter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<CountryCode>('US');
  const countriesRef = useRef(getCountryOptions());

  function computeNormalized(): string | null {
    // If user typed national digits without +, try auto-prepend using selected country then parse.
  const candidate = phone.startsWith('+') ? phone : autoPrependCountry(phone, country);
  return formatPhoneE164(candidate, { defaultCountry: country });
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    const norm = computeNormalized();
    if (!norm) {
      setError('Enter a valid international number (e.g. +16892243543)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await startPhoneVerification(norm);
      setNormalizedPhone(norm);
      toast.success('Code sent');
      setStep('code');
    } catch (err) {
      toast.error((err as Error).message || 'Failed');
    } finally { setLoading(false); }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const norm = normalizedPhone || computeNormalized();
    if (!norm || !isLikelyE164(norm)) {
      setError('Phone format invalid');
      return;
    }
    setLoading(true);
    try {
  const resp: VerifyPhoneResponse = await verifyPhone(norm, code.trim());
  if (resp.token || resp.user) {
    const u = resp.user;
    if (u) {
      const coerced = { ...u, id: typeof u.id === 'number' ? u.id : Number(u.id) || undefined } as { id?: number; email: string; name?: string; emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean };
      try { applyAuth?.(resp.token || null, coerced); } catch { /* ignore */ }
    } else if (resp.token) {
      try { applyAuth?.(resp.token || null); } catch { /* ignore */ }
    }
  }
  toast.success('Phone verified');
  try { await getMe(); } catch { /* ignore refresh errors */ }
  const target = nextRouteFromSteps(resp.nextStep, resp.verificationStep);
  navigate(target, { replace: true });
    } catch (err) {
      toast.error((err as Error).message || 'Verification failed');
    } finally { setLoading(false); }
  }

  async function resend() {
    try {
      const norm = normalizedPhone || computeNormalized();
      if (!norm) {
        setError('Phone format invalid');
        return;
      }
      await resendPhoneVerification(norm);
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
                <Label htmlFor="phone" className="block text-center">Phone number</Label>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex w-full items-center gap-2">
                    <div className="w-40">
                      <Select value={country} onValueChange={(v)=>setCountry(v as CountryCode)}>
                        <SelectTrigger aria-label="Country" size="sm">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 bg-[color:var(--owl-popover-bg)]">
                          {countriesRef.current.slice(0,40).map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.flag} +{c.callingCode} {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input id="phone" placeholder="(689) 224-3543" value={phone} onChange={e=>setPhone(e.target.value)} />
                  </div>
                  {normalizedPhone && <p className="text-[10px] text-[color:var(--owl-text-secondary)]">Will send: {normalizedPhone}</p>}
                </div>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <div className="flex flex-col items-center">
                <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</Button>
              </div>
        <Link to="/auth/verify-email" className="block text-center text-xs text-[color:var(--owl-text-secondary)] hover:underline">Back to email verification</Link>
            </form>
          )}
          {step === 'code' && (
            <form onSubmit={submitCode} className="space-y-4">
              <p className="text-xs text-center text-[color:var(--owl-text-secondary)]">We sent a code to {normalizedPhone || phone}</p>
              <div>
                <Label htmlFor="code">Code</Label>
                <div className="flex flex-col items-center gap-2">
                  <Input id="code" className="text-center" value={code} onChange={e=>setCode(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify phone'}</Button>
                <button type="button" onClick={resend} className="text-xs text-[color:var(--owl-accent)] hover:underline">Resend code</button>
                <button type="button" onClick={()=>setStep('enter')} className="block w-full text-center text-xs text-[color:var(--owl-text-secondary)] hover:underline">Change number</button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
