import { useForm } from "react-hook-form";
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { PasswordField } from "../../components/ui/password-field";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";
import useApiBase from "../../hooks/useApiBase";

type FormValues = { email: string; password: string };

const EMAIL_RE = /.+@.+\..+/;

export default function LoginScreen() {
  const { login } = useAuth();
  const apiBase = useApiBase();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const from = location.state?.from?.pathname;
  const failCountRef = useRef(0); // internal counter (value not displayed)
  const [showResetHint, setShowResetHint] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });
  // password visibility handled by PasswordField component

  const onSubmit = handleSubmit(async (vals: FormValues) => {
    try {
      // Normalize email casing before sending (backend treats emails case-insensitively)
      const normalizedEmail = vals.email.trim().toLowerCase();
      const hadPrevious = !!localStorage.getItem("auth_token");
      const { verificationStep, nextStep } = await login(normalizedEmail, vals.password);
      toast.success("Welcome back!");
  failCountRef.current = 0; setShowResetHint(false);
      // Decide next route from backend-provided step for progressive verification
  // Derive step; if backend omitted fields, infer from stored user record in localStorage refresh via guards later.
  const step = nextStep || verificationStep;
  if (step === 'email') navigate('/auth/verify-email', { replace: true });
  else if (step === 'phone') navigate('/auth/verify-phone', { replace: true });
  else if (step === 'kyc') navigate('/auth/kyc', { replace: true });
  else { // 'complete' or undefined treated as fully verified
        // fully verified
        if (!hadPrevious) navigate('/onboarding/coach', { replace: true });
        else navigate(from || '/home', { replace: true });
      }
    } catch (e) {
      const err = e as Error;
      // Count only 401/Unauthorized style failures toward reset hint
      const message = err.message || 'Login failed';
      if (/unauthorized|401|invalid credentials|email not verified/i.test(message)) {
  const next = failCountRef.current + 1;
  failCountRef.current = next;
  if (next >= 3) setShowResetHint(true);
      }
      toast.error(message);
    }
  });

  return (
    <div>
      <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)]">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'login-email-error' : undefined} autoComplete="email" {...register("email", { required: "Email is required", pattern: { value: EMAIL_RE, message: "Enter a valid email" } })} />
              {errors.email && <p id="login-email-error" className="text-xs text-[color:var(--owl-accent)]">{errors.email.message}</p>}
            </div>
            <PasswordField id="password" label="Password" autoComplete="current-password" aria-invalid={errors.password ? 'true' : undefined} aria-describedby={errors.password ? 'login-password-error' : undefined} {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min length is 8" } })} />
            {errors.password && <p id="login-password-error" className="text-xs text-[color:var(--owl-accent)]">{errors.password.message}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            {isSubmitting && <p className="text-xs text-center text-[color:var(--owl-text-secondary)]">Contacting {apiBase}…</p>}
            {showResetHint && (
              <p className="mt-2 text-xs text-[color:var(--owl-accent)] text-center">
                Having trouble? <button type="button" onClick={() => navigate('/auth/forgot')} className="underline">Reset your password</button>.
              </p>
            )}
          </form>
          <div className="mt-3 text-center">
            <Link to="/auth/forgot" className="text-sm text-[color:var(--owl-accent)] hover:underline">Forgot password?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
