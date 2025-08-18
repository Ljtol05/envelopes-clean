import React from 'react'; void React;
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { PHONE_VERIFICATION_REQUIRED } from '../../lib/onboarding';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';

// Simple linear step progress indicator for auth/onboarding: Email -> (Phone) -> KYC.
// Highlights current step, shows checkmarks for completed ones, accessible summary via aria-label.
export default function AuthProgress() {
  const { user } = useAuth();
  const loc = useLocation();
  const phoneRequired = PHONE_VERIFICATION_REQUIRED;
  const path = loc.pathname;
  const active: 'email' | 'phone' | 'kyc' = /verify-phone/.test(path)
    ? 'phone'
    : /kyc/.test(path)
      ? 'kyc'
      : 'email';

  interface KycLike { kycApproved?: boolean; kycStatus?: string }
  const ku = user as unknown as KycLike | undefined;
  const kycDone = !!(ku && (ku.kycApproved === true || ku.kycStatus === 'approved'));

  type Step = { key: 'email' | 'phone' | 'kyc'; label: string; done: boolean; active: boolean };
  const steps: Step[] = [
    { key: 'email', label: 'Email', done: !!user?.emailVerified, active: active === 'email' },
    ...(phoneRequired ? [{ key: 'phone', label: 'Phone', done: !!user?.phoneVerified, active: active === 'phone' } as Step] : []),
    { key: 'kyc', label: 'KYC', done: kycDone, active: active === 'kyc' },
  ];
  const ariaSummary = steps.map(s => `${s.label} ${s.done ? 'complete' : s.active ? 'current' : 'pending'}`).join(', ');
  const reduceMotion = usePrefersReducedMotion();
  const circleBase = reduceMotion ? 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium select-none' : 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium select-none transition-all duration-300';
  const connectorAnim = reduceMotion ? '' : 'transition-transform duration-500';
  return (
    <nav aria-label="Onboarding progress" className="w-full max-w-md mx-auto mt-4 mb-6 px-4">
      <span className="sr-only" aria-hidden={false}>{ariaSummary}</span>
  <ol className={reduceMotion ? 'flex items-center gap-2' : 'flex items-center gap-2 transition-all duration-300'}>
        {steps.map((s,i) => (
          <React.Fragment key={s.key}>
            <li className="flex flex-col items-center gap-1 min-w-[2.5rem]">
              <div
                className={[
                  circleBase,
                  s.done
                    ? `bg-[color:var(--owl-success)] text-white ${reduceMotion ? '' : 'scale-110'}`
                    : s.active
                      ? 'border-2 border-[color:var(--owl-accent)] text-[color:var(--owl-text-primary)] shadow-sm'
                      : 'border border-[color:var(--owl-border)] text-[color:var(--owl-text-secondary)] opacity-80'
                ].join(' ')}
              >
                {s.done ? '✓' : i + 1}
              </div>
              <span className="text-[10px] uppercase tracking-wide text-[color:var(--owl-text-secondary)]" aria-hidden="true">{s.label}</span>
            </li>
            {i < steps.length-1 && (
              <li aria-hidden="true" className="flex-1 h-px bg-[color:var(--owl-border)] relative overflow-hidden">
                <span className={`absolute inset-0 bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))] ${connectorAnim} origin-left ${steps[i].done ? 'scale-x-100' : 'scale-x-0'}`}></span>
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}
