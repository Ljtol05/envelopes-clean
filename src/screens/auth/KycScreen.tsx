import React from 'react'; // needed for jsx in test env
void React;
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useKyc } from '../../hooks/useKyc';
import { useAuth } from '../../context/useAuth';
import type { KycFormData } from '../../types/kyc';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { fetchAddressSuggestions, applySuggestion, fetchPlaceDetails, type AddressSuggestion } from '../../lib/addressAutocomplete';
import { lookupZip } from '../../lib/zipLookup';
import AuthProgress from '../../components/auth/AuthProgress';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';

// Zod schema for form validation with age refinement (18+)
function isAdult(dob: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const [y,m,d] = dob.split('-').map(Number);
  const birth = new Date(Date.UTC(y, m-1, d));
  if (isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const mDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age >= 18;
}
const schema = z.object({
  legalFirstName: z.string().min(1, 'Required'),
  legalLastName: z.string().min(1, 'Required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Must be YYYY-MM-DD').refine(isAdult, 'Must be 18 or older'),
  ssnLast4: z.string().length(4,'Must be 4 digits'),
  addressLine1: z.string().min(1,'Required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1,'Required'),
  state: z.string().length(2,'2-letter state code'),
  postalCode: z.string().min(5,'Too short'),
});

// Inline component for address line 1 autocomplete (kept local to file for now)
interface AddressLine1Props {
  register: ReturnType<typeof useForm>['register'];
  watch: ReturnType<typeof useForm>['watch'];
  setValue: ReturnType<typeof useForm>['setValue'];
  error?: string;
}
function AddressLine1Autocomplete({ register, watch, setValue, error }: AddressLine1Props) {
  const [q, setQ] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const abortRef = React.useRef<AbortController | null>(null);
  const val = watch('addressLine1') as string;
  React.useEffect(() => { setQ(val || ''); }, [val]);
  React.useEffect(() => {
    if (!q || q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t = setTimeout(async () => {
      const res = await fetchAddressSuggestions(q, { signal: ctrl.signal });
      setSuggestions(res);
      setOpen(res.length > 0);
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);
  async function choose(s: AddressSuggestion) {
    // Merge basic suggestion first (city/state/postalCode if present)
    const current = { city: watch('city'), state: watch('state'), postalCode: watch('postalCode') } as Record<string,string>;
    const merged = applySuggestion(current, s);
    Object.entries(merged).forEach(([k,v]) => v && setValue(k as keyof KycFormData, v as string, { shouldDirty: true }));
    setValue('addressLine1', s.description.split(',')[0] || s.description, { shouldDirty: true });
    // Attempt structured place details enrichment (street number, route, postal code variations)
    try {
      const details = await fetchPlaceDetails(s.id);
      if (details) {
        if (details.addressLine1) setValue('addressLine1', details.addressLine1, { shouldDirty: true });
        if (details.city && !watch('city')) setValue('city', details.city, { shouldDirty: true });
        if (details.state && !watch('state')) setValue('state', details.state, { shouldDirty: true });
        if (details.postalCode && !watch('postalCode')) setValue('postalCode', details.postalCode, { shouldDirty: true });
      }
    } catch {
      // Silent failure; user can complete manually
    }
    setOpen(false); setSuggestions([]);
    setActiveIndex(-1);
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter') { if (activeIndex >= 0) { e.preventDefault(); choose(suggestions[activeIndex]); } }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
  }
  return (
    <div className="col-span-2 relative">
      <Label htmlFor="addressLine1">Address line 1</Label>
      <Input id="addressLine1" autoComplete="off" aria-autocomplete="list" aria-expanded={open? 'true':'false'} aria-controls="addressLine1-suggestions" aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'addressLine1-error' : undefined} {...register('addressLine1')} onChange={(e)=>{ setQ(e.target.value); register('addressLine1').onChange(e); }} onKeyDown={onKeyDown} />
      {error && <p id="addressLine1-error" className="text-xs text-red-500">{error}</p>}
      {open && suggestions.length > 0 && (
        <ul aria-label="Address suggestions" id="addressLine1-suggestions" role="listbox" className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-[color:var(--owl-border)] bg-[color:var(--owl-popover-bg)] shadow-[var(--owl-shadow-md)] text-sm">
          {suggestions.map((s,i) => {
            const active = i === activeIndex;
            return (
              <li key={s.id} role="option" tabIndex={-1} className={`px-2 py-1 cursor-pointer ${active ? 'bg-[color:var(--owl-accent-bg)]' : 'hover:bg-[color:var(--owl-accent-bg)] focus:bg-[color:var(--owl-accent-bg)]'}`} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActiveIndex(i)} onClick={()=>choose(s)}>{s.description}</li>
            );
          })}
          <li className="px-2 py-1 text-[10px] opacity-70 select-none" aria-hidden="true">Powered by Google</li>
        </ul>
      )}
    </div>
  );
}

export default function KycScreen() {
  // Disable automatic polling during tests by respecting env flag; prod keeps defaults.
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const { status, error, submitting, submitKyc, reset, refresh } = useKyc(isTest ? { autoPoll: false } : undefined);
  const { user } = useAuth();
  const navigate = useNavigate();
  const from = '/home';

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      legalFirstName: '',
      legalLastName: '',
      dob: '',
      ssnLast4: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
    },
  });

  // Prefill name from user.name (split on first space) once on mount.
  React.useEffect(() => {
    if (user?.name) {
      const firstCurrent = (watch('legalFirstName') as string) || '';
      const lastCurrent = (watch('legalLastName') as string) || '';
      if (!firstCurrent && !lastCurrent) {
        const parts = user.name.trim().split(/\s+/);
        if (parts[0]) setValue('legalFirstName', parts[0]);
        if (parts.length > 1) setValue('legalLastName', parts.slice(1).join(' '));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name]);

  // Dynamic DOB formatting: allow typing digits or separators; auto-insert dashes YYYY-MM-DD.
  const dobVal = watch('dob');
  function handleDobChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g,'').slice(0,8); // YYYYMMDD digits only
    let formatted = raw;
    if (raw.length > 4) formatted = raw.slice(0,4) + '-' + raw.slice(4);
    if (raw.length > 6) formatted = raw.slice(0,4) + '-' + raw.slice(4,6) + '-' + raw.slice(6);
    setValue('dob', formatted);
  }

  // ZIP fallback enrichment (only fills missing city/state)
  const zipVal = watch('postalCode') as string;
  React.useEffect(() => {
    let active = true;
    (async () => {
      if (zipVal && zipVal.length === 5) {
        const currentCity = watch('city') as string;
        const currentState = watch('state') as string;
        if (currentCity && currentState) return; // already set
        const info = await lookupZip(zipVal);
        if (info && active) {
          if (!currentCity && info.city) setValue('city', info.city, { shouldDirty: true });
          if (!currentState && info.state) setValue('state', info.state, { shouldDirty: true });
        }
      }
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipVal]);

  const onSubmit = handleSubmit(async (values: Record<string, unknown>) => {
    await submitKyc(values as unknown as KycFormData);
  });

  // Optional multi-step wizard (experimental) guarded by env flag to avoid breaking existing tests.
  // Wizard now ON by default; can be disabled by explicitly setting VITE_KYC_WIZARD="false" in any env source.
  const wizardFlagValue = (
    (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string,string> }).env?.VITE_KYC_WIZARD) ??
    ((globalThis as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv?.VITE_KYC_WIZARD) ??
    (typeof process !== 'undefined' ? process.env?.VITE_KYC_WIZARD : undefined)
  );
  const wizardEnabled = wizardFlagValue !== 'false';

  type WizardKey = 'name' | 'dob' | 'ssn' | 'address1' | 'address2' | 'review';
  interface WizardStep { key: WizardKey; label: string; fields: (keyof KycFormData)[]; }
  const wizardSteps: WizardStep[] = [
    { key: 'name', label: 'Name', fields: ['legalFirstName','legalLastName'] },
    { key: 'dob', label: 'Birth Date', fields: ['dob'] },
    { key: 'ssn', label: 'SSN', fields: ['ssnLast4'] },
    { key: 'address1', label: 'Address', fields: ['addressLine1','addressLine2'] },
    { key: 'address2', label: 'Location', fields: ['city','state','postalCode'] },
    { key: 'review', label: 'Review', fields: [] },
  ];
  const [wizIndex, setWizIndex] = React.useState(0);
  const currentStep = wizardSteps[wizIndex];

  // Segmented DOB inputs for wizard mode
  const dobRaw = (watch('dob') as string) || '';
  const [dobMonth, setDobMonth] = React.useState('');
  const [dobDay, setDobDay] = React.useState('');
  const [dobYear, setDobYear] = React.useState('');
  const mmRef = React.useRef<HTMLInputElement | null>(null);
  const ddRef = React.useRef<HTMLInputElement | null>(null);
  const yyRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (dobRaw && /^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
      const [y,m,d] = dobRaw.split('-');
      setDobYear(y); setDobMonth(m); setDobDay(d);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function syncDob(y: string, m: string, d: string) {
    if (y.length === 4 && m.length === 2 && d.length === 2) {
      setValue('dob', `${y}-${m}-${d}`, { shouldDirty: true, shouldValidate: false });
    } else {
      setValue('dob', '', { shouldDirty: true, shouldValidate: false });
    }
  }
  function onDobMonth(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9]/g,'').slice(0,2);
    setDobMonth(v);
    if (v.length === 2) ddRef.current?.focus();
    syncDob(dobYear,v,dobDay);
  }
  function onDobDay(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9]/g,'').slice(0,2);
    setDobDay(v);
    if (v.length === 2) yyRef.current?.focus();
    syncDob(dobYear,dobMonth,v);
  }
  function onDobYear(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9]/g,'').slice(0,4);
    setDobYear(v);
    syncDob(v,dobMonth,dobDay);
  }

  async function nextWizard() {
    if (currentStep.key === 'review') return;
    if (wizAdvancingRef.current) return; // guard against double click
    wizAdvancingRef.current = true;
    setWizAdvancing(true);
    // Defer validation to next tick to absorb any rapidly queued click events
    await Promise.resolve();
    const valid = await trigger(currentStep.fields as string[]);
    if (valid) {
      setWizIndex(i => Math.min(i + 1, wizardSteps.length - 1));
    }
    // Release guard after short delay
    setTimeout(() => { wizAdvancingRef.current = false; setWizAdvancing(false); }, 80);
  }
  function prevWizard() { setWizIndex(i => Math.max(i-1, 0)); }

  const reduceMotion = usePrefersReducedMotion();
  const isLastStep = currentStep.key === 'review';
  // Ref used to block rapid successive next submissions
  const wizAdvancingRef = React.useRef(false);
  const [wizAdvancing, setWizAdvancing] = React.useState(false);

  // Redirect once approved (side-effect)
  React.useEffect(() => {
    if (status?.status === 'approved') {
      const id = setTimeout(() => navigate(from, { replace: true }), 200);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [status?.status, navigate, from]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <AuthProgress />
      <Card className="bg-[color:var(--owl-surface)] border border-[color:var(--owl-border)] shadow-[var(--owl-shadow-md)] mt-4 w-full max-w-xl">
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {status?.status === 'pending' && (
            <div className="space-y-4">
              <p className="text-sm">Your information is being reviewed. This usually takes a minute…</p>
              {isTest && <Button type="button" variant="outline" onClick={() => refresh()}>Poll now</Button>}
            </div>
          )}
          {status?.status === 'rejected' && (
            <div className="space-y-4">
              <p className="text-sm text-red-500">We couldn't verify your identity. {status.reason && `Reason: ${status.reason}`}</p>
              <Button variant="secondary" onClick={reset}>Try again</Button>
            </div>
          )}
          {(!status || status.status === 'not_started' || status.status === 'rejected') && !wizardEnabled && (
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legalFirstName">First name</Label>
                <Input id="legalFirstName" aria-invalid={errors.legalFirstName ? 'true' : undefined} aria-describedby={errors.legalFirstName ? 'legalFirstName-error' : undefined} {...register('legalFirstName')} onFocus={e=>e.target.select()} />
                {errors.legalFirstName && (<p id="legalFirstName-error" className="text-xs text-red-500">{errors.legalFirstName.message}</p>)}
              </div>
              <div>
                <Label htmlFor="legalLastName">Last name</Label>
                <Input id="legalLastName" aria-invalid={errors.legalLastName ? 'true' : undefined} aria-describedby={errors.legalLastName ? 'legalLastName-error' : undefined} {...register('legalLastName')} onFocus={e=>e.target.select()} />
                {errors.legalLastName && (<p id="legalLastName-error" className="text-xs text-red-500">{errors.legalLastName.message}</p>)}
              </div>
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" placeholder="YYYY-MM-DD" value={dobVal} onChange={handleDobChange} aria-invalid={errors.dob ? 'true' : undefined} aria-describedby={errors.dob ? 'dob-error' : undefined} {...register('dob')} />
                {errors.dob && (<p id="dob-error" className="text-xs text-red-500">{errors.dob.message}</p>)}
              </div>
              <div>
                <Label htmlFor="ssnLast4">SSN (last 4)</Label>
                <Input id="ssnLast4" inputMode="numeric" maxLength={4} aria-invalid={errors.ssnLast4 ? 'true' : undefined} aria-describedby={errors.ssnLast4 ? 'ssnLast4-error' : undefined} {...register('ssnLast4')} />
                {errors.ssnLast4 && (<p id="ssnLast4-error" className="text-xs text-red-500">{errors.ssnLast4.message}</p>)}
              </div>
              <AddressLine1Autocomplete register={register} watch={watch} setValue={setValue} error={errors.addressLine1?.message as string | undefined} />
              <div className="col-span-2">
                <Label htmlFor="addressLine2">Address line 2</Label>
                <Input id="addressLine2" aria-invalid={errors.addressLine2 ? 'true' : undefined} aria-describedby={errors.addressLine2 ? 'addressLine2-error' : undefined} {...register('addressLine2')} />
                {errors.addressLine2 && (<p id="addressLine2-error" className="text-xs text-red-500">{errors.addressLine2.message}</p>)}
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" aria-invalid={errors.city ? 'true' : undefined} aria-describedby={errors.city ? 'city-error' : undefined} {...register('city')} />
                {errors.city && <p id="city-error" className="text-xs text-red-500">{errors.city.message}</p>}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" maxLength={2} placeholder="GA" aria-invalid={errors.state ? 'true' : undefined} aria-describedby={errors.state ? 'state-error' : undefined} {...register('state')} />
                {errors.state && <p id="state-error" className="text-xs text-red-500">{errors.state.message}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="postalCode">ZIP code</Label>
                <Input id="postalCode" inputMode="numeric" aria-invalid={errors.postalCode ? 'true' : undefined} aria-describedby={errors.postalCode ? 'postalCode-error' : undefined} {...register('postalCode')} />
                {errors.postalCode && (<p id="postalCode-error" className="text-xs text-red-500">{errors.postalCode.message}</p>)}
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit for verification'}
                </Button>
              </div>
              {error && (<div className="col-span-2 text-sm text-red-500">{error}</div>)}
            </form>
          )}
          {(!status || status.status === 'not_started' || status.status === 'rejected') && wizardEnabled && (
            <div>
              <div className="mb-4">
                <ol className={reduceMotion ? 'flex items-center gap-2 text-[10px] uppercase tracking-wide' : 'flex items-center gap-2 text-[10px] uppercase tracking-wide transition-all'}>
                  {wizardSteps.map((s,i) => (
                    <React.Fragment key={s.key}>
                      <li className={`flex flex-col items-center ${i===wizIndex ? 'text-[color:var(--owl-accent)]' : 'text-[color:var(--owl-text-secondary)]'}`}
                        aria-current={i===wizIndex ? 'step' : undefined}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium mb-1 ${i<wizIndex ? 'bg-[color:var(--owl-success)] text-white' : i===wizIndex ? 'border-2 border-[color:var(--owl-accent)]' : 'border border-[color:var(--owl-border)]'} ${reduceMotion ? '' : 'transition-all duration-300'} ${i<wizIndex && !reduceMotion ? 'scale-110' : ''}`}>{i<wizIndex ? '✓' : i+1}</div>
                        {s.label}
                      </li>
                      {i < wizardSteps.length -1 && <li aria-hidden="true" className="flex-1 h-px bg-[color:var(--owl-border)]" />}
                    </React.Fragment>
                  ))}
                </ol>
              </div>
              <form onSubmit={isLastStep ? onSubmit : (e)=>{ e.preventDefault(); nextWizard(); }} className="space-y-6">
                {currentStep.key === 'name' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="wizard-step-name">
                    <div>
                      <Label htmlFor="legalFirstName">First name</Label>
                      <Input id="legalFirstName" aria-invalid={errors.legalFirstName ? 'true' : undefined} aria-describedby={errors.legalFirstName ? 'legalFirstName-error' : undefined} {...register('legalFirstName')} />
                      {errors.legalFirstName && (<p id="legalFirstName-error" className="text-xs text-red-500">{errors.legalFirstName.message}</p>)}
                    </div>
                    <div>
                      <Label htmlFor="legalLastName">Last name</Label>
                      <Input id="legalLastName" aria-invalid={errors.legalLastName ? 'true' : undefined} aria-describedby={errors.legalLastName ? 'legalLastName-error' : undefined} {...register('legalLastName')} />
                      {errors.legalLastName && (<p id="legalLastName-error" className="text-xs text-red-500">{errors.legalLastName.message}</p>)}
                    </div>
                  </div>
                )}
                {currentStep.key === 'dob' && (
                  <div data-testid="wizard-step-dob" data-segmented="true">
                    <Label>Date of birth</Label>
                    {/* Hidden registered field to integrate with react-hook-form & validation */}
                    <input type="hidden" data-testid="dob-hidden" {...register('dob')} />
                    <div className="flex gap-2 items-center">
                      <Input ref={mmRef} id="dob-month" placeholder="MM" inputMode="numeric" maxLength={2} value={dobMonth} onChange={onDobMonth} className="w-16 text-center" aria-label="Month" />
                      <span>/</span>
                      <Input ref={ddRef} id="dob-day" placeholder="DD" inputMode="numeric" maxLength={2} value={dobDay} onChange={onDobDay} className="w-16 text-center" aria-label="Day" />
                      <span>/</span>
                      <Input ref={yyRef} id="dob-year" placeholder="YYYY" inputMode="numeric" maxLength={4} value={dobYear} onChange={onDobYear} className="w-24 text-center" aria-label="Year" />
                    </div>
                    {errors.dob && (<p id="dob-error" className="text-xs text-red-500 mt-1">{errors.dob.message}</p>)}
                    <p className="text-[10px] text-[color:var(--owl-text-secondary)] mt-1">You must be 18 or older.</p>
                  </div>
                )}
                {currentStep.key === 'ssn' && (
                  <div data-testid="wizard-step-ssn">
                    <Label htmlFor="ssnLast4">SSN (last 4)</Label>
                    <Input id="ssnLast4" inputMode="numeric" maxLength={4} aria-invalid={errors.ssnLast4 ? 'true' : undefined} aria-describedby={errors.ssnLast4 ? 'ssnLast4-error' : undefined} {...register('ssnLast4')} />
                    {errors.ssnLast4 && (<p id="ssnLast4-error" className="text-xs text-red-500">{errors.ssnLast4.message}</p>)}
                  </div>
                )}
                {currentStep.key === 'address1' && (
                  <div className="grid gap-4" data-testid="wizard-step-address1">
                    <AddressLine1Autocomplete register={register} watch={watch} setValue={setValue} error={errors.addressLine1?.message as string | undefined} />
                    <div>
                      <Label htmlFor="addressLine2">Address line 2</Label>
                      <Input id="addressLine2" aria-invalid={errors.addressLine2 ? 'true' : undefined} aria-describedby={errors.addressLine2 ? 'addressLine2-error' : undefined} {...register('addressLine2')} />
                      {errors.addressLine2 && (<p id="addressLine2-error" className="text-xs text-red-500">{errors.addressLine2.message}</p>)}
                    </div>
                  </div>
                )}
                {currentStep.key === 'address2' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="wizard-step-address2">
                    <div className="md:col-span-1">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" aria-invalid={errors.city ? 'true' : undefined} aria-describedby={errors.city ? 'city-error' : undefined} {...register('city')} />
                      {errors.city && <p id="city-error" className="text-xs text-red-500">{errors.city.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" maxLength={2} placeholder="GA" aria-invalid={errors.state ? 'true' : undefined} aria-describedby={errors.state ? 'state-error' : undefined} {...register('state')} />
                      {errors.state && <p id="state-error" className="text-xs text-red-500">{errors.state.message}</p>}
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="postalCode">ZIP code</Label>
                      <Input id="postalCode" inputMode="numeric" aria-invalid={errors.postalCode ? 'true' : undefined} aria-describedby={errors.postalCode ? 'postalCode-error' : undefined} {...register('postalCode')} />
                      {errors.postalCode && (<p id="postalCode-error" className="text-xs text-red-500">{errors.postalCode.message}</p>)}
                    </div>
                  </div>
                )}
                {currentStep.key === 'review' && (
                  <div className="space-y-4" data-testid="wizard-step-review">
                    <h3 className="text-sm font-medium">Review</h3>
                    <ul className="text-xs grid gap-1">
                      <li><strong>Name:</strong> {watch('legalFirstName')} {watch('legalLastName')}</li>
                      <li><strong>DOB:</strong> {watch('dob') || '—'}</li>
                      <li><strong>SSN:</strong> ••••{(watch('ssnLast4') as string) || ''}</li>
                      <li><strong>Address:</strong> {watch('addressLine1')} {watch('addressLine2')}</li>
                      <li><strong>City/State/ZIP:</strong> {watch('city')}, {watch('state')} {watch('postalCode')}</li>
                    </ul>
                    {error && (<div className="text-sm text-red-500">{error}</div>)}
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="ghost" disabled={wizIndex===0 || submitting} onClick={prevWizard}>Back</Button>
                  {isLastStep ? (
                    <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
                  ) : (
                    <Button type="submit" variant="default" disabled={submitting || wizAdvancing}>Next</Button>
                  )}
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
