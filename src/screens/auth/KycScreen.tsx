import React from 'react'; // needed for jsx in test env
void React;
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useKyc } from '../../hooks/useKyc';
import type { KycFormData } from '../../types/kyc';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

// Zod schema for form validation.
const schema = z.object({
  legalFirstName: z.string().min(1, 'Required'),
  legalLastName: z.string().min(1, 'Required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Must be YYYY-MM-DD'),
  ssnLast4: z.string().length(4,'Must be 4 digits'),
  addressLine1: z.string().min(1,'Required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1,'Required'),
  state: z.string().length(2,'2-letter state code'),
  postalCode: z.string().min(5,'Too short'),
});

export default function KycScreen() {
  // Disable automatic polling during tests by respecting env flag; prod keeps defaults.
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const { status, error, submitting, submitKyc, reset, refresh } = useKyc(isTest ? { autoPoll: false } : undefined);
  const navigate = useNavigate();
  const from = '/home';

  const { register, handleSubmit, formState: { errors } } = useForm({
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
                <Input id="legalFirstName" aria-invalid={errors.legalFirstName ? 'true' : undefined} aria-describedby={errors.legalFirstName ? 'legalFirstName-error' : undefined} {...register('legalFirstName')} />
                {errors.legalFirstName && (<p id="legalFirstName-error" className="text-xs text-red-500">{errors.legalFirstName.message}</p>)}
              </div>
              <div>
                <Label htmlFor="legalLastName">Last name</Label>
                <Input id="legalLastName" aria-invalid={errors.legalLastName ? 'true' : undefined} aria-describedby={errors.legalLastName ? 'legalLastName-error' : undefined} {...register('legalLastName')} />
                {errors.legalLastName && (<p id="legalLastName-error" className="text-xs text-red-500">{errors.legalLastName.message}</p>)}
              </div>
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" placeholder="YYYY-MM-DD" aria-invalid={errors.dob ? 'true' : undefined} aria-describedby={errors.dob ? 'dob-error' : undefined} {...register('dob')} />
                {errors.dob && (<p id="dob-error" className="text-xs text-red-500">{errors.dob.message}</p>)}
              </div>
              <div>
                <Label htmlFor="ssnLast4">SSN (last 4)</Label>
                <Input id="ssnLast4" inputMode="numeric" maxLength={4} aria-invalid={errors.ssnLast4 ? 'true' : undefined} aria-describedby={errors.ssnLast4 ? 'ssnLast4-error' : undefined} {...register('ssnLast4')} />
                {errors.ssnLast4 && (<p id="ssnLast4-error" className="text-xs text-red-500">{errors.ssnLast4.message}</p>)}
              </div>
              <div className="col-span-2">
                <Label htmlFor="addressLine1">Address line 1</Label>
                <Input id="addressLine1" aria-invalid={errors.addressLine1 ? 'true' : undefined} aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined} {...register('addressLine1')} />
                {errors.addressLine1 && (<p id="addressLine1-error" className="text-xs text-red-500">{errors.addressLine1.message}</p>)}
              </div>
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
