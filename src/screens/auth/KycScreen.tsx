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
              <li key={s.id} role="option" aria-selected={active ? true : undefined} tabIndex={-1} className={`px-2 py-1 cursor-pointer ${active ? 'bg-[color:var(--owl-accent-bg)]' : 'hover:bg-[color:var(--owl-accent-bg)] focus:bg-[color:var(--owl-accent-bg)]'}`} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActiveIndex(i)} onClick={()=>choose(s)}>{s.description}</li>
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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
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

  // Redirect once approved (side-effect)
  React.useEffect(() => {
    if (status?.status === 'approved') {
      const id = setTimeout(() => navigate(from, { replace: true }), 200);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [status?.status, navigate, from]);

  return (
  <div className="p-4 max-w-xl mx-auto">
      <Card className="bg-[color:var(--owl-surface)] border border-[color:var(--owl-border)] shadow-[var(--owl-shadow-md)]">
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
          {(!status || status.status === 'not_started' || status.status === 'rejected') && (
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
                <Input id="dob" placeholder="YYYY-MM-DD" value={dobVal} onChange={handleDobChange} aria-invalid={errors.dob ? 'true' : undefined} aria-describedby={errors.dob ? 'dob-error' : undefined} />
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
        </CardContent>
      </Card>
    </div>
  );
}
