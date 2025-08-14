import React, { useState } from "react";
void React;
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import useApiBase from "../../hooks/useApiBase";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

// simple helper styling (kept as function returning className string to avoid custom li wrapper)
const pwClass = (ok: boolean) => "flex items-center gap-1 " + (ok ? 'text-[color:var(--owl-success,#16a34a)]' : 'text-[color:var(--owl-text-secondary)]');

interface FormValues { firstName: string; lastName: string; email: string; password: string }
const EMAIL_RE = /.+@.+\..+/;

export default function RegisterScreen() {
  const { register: doRegister } = useAuth();
  const apiBase = useApiBase();
  const navigate = useNavigate();

  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { firstName: "", lastName: "", email: "", password: "" } });
  const values = watch();
  const [showPw, setShowPw] = useState(false);

  // Password requirement helpers
  const pw = values.password || "";
  const reqs = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
  };
  const allReqs = Object.values(reqs).every(Boolean);

  const onSubmit = async (vals: FormValues) => {
    try {
      const name = `${vals.firstName.trim()} ${vals.lastName.trim()}`.trim();
      await doRegister(name, vals.email, vals.password);
      toast.success("Account created");
      navigate("/auth/verify-email", { replace: true });
    } catch (e) {
      const err = e as Error & { status?: number };
      toast.error(err.message || "Registration failed");
    }
  };

  return (
    <div>
      <Card className="w-full max-w-md mx-auto bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)]">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" aria-invalid={errors.firstName ? 'true' : undefined} aria-describedby={errors.firstName ? 'register-first-error' : undefined} autoComplete="given-name" {...register("firstName", { required: "Required" })} />
                {errors.firstName && <p id="register-first-error" className="text-xs text-[color:var(--owl-accent)]">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" aria-invalid={errors.lastName ? 'true' : undefined} aria-describedby={errors.lastName ? 'register-last-error' : undefined} autoComplete="family-name" {...register("lastName", { required: "Required" })} />
                {errors.lastName && <p id="register-last-error" className="text-xs text-[color:var(--owl-accent)]">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'register-email-error' : undefined} autoComplete="email" {...register("email", { required: "Email is required", pattern: { value: EMAIL_RE, message: "Enter a valid email" } })} />
              {errors.email && <p id="register-email-error" className="text-xs text-[color:var(--owl-accent)]">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} aria-invalid={errors.password ? 'true' : undefined} aria-describedby={errors.password ? 'register-password-error' : undefined} autoComplete="new-password" {...register("password", { required: "Required", validate: {
                  length: (v: string)=> v.length>=8 || 'At least 8 chars',
                  upper: (v: string)=> /[A-Z]/.test(v) || 'Need uppercase',
                  lower: (v: string)=> /[a-z]/.test(v) || 'Need lowercase',
                  digit: (v: string)=> /\d/.test(v) || 'Need digit'
                } })} />
                <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[color:var(--owl-accent)] hover:underline select-none">{showPw? 'Hide':'Show'}</button>
              </div>
              <ul className="mt-1 space-y-0.5 text-[10px] leading-tight">
                <li className={pwClass(reqs.length)}><span aria-hidden="true" className="inline-block w-3 text-center">{reqs.length?'✓':'•'}</span><span>At least 8 characters</span></li>
                <li className={pwClass(reqs.upper)}><span aria-hidden="true" className="inline-block w-3 text-center">{reqs.upper?'✓':'•'}</span><span>One uppercase letter</span></li>
                <li className={pwClass(reqs.lower)}><span aria-hidden="true" className="inline-block w-3 text-center">{reqs.lower?'✓':'•'}</span><span>One lowercase letter</span></li>
                <li className={pwClass(reqs.digit)}><span aria-hidden="true" className="inline-block w-3 text-center">{reqs.digit?'✓':'•'}</span><span>One number</span></li>
              </ul>
              {errors.password && <p id="register-password-error" className="text-xs text-[color:var(--owl-accent)]">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || !allReqs} className="w-full">
              {isSubmitting ? "Submitting…" : "Submit"}
            </Button>
            {isSubmitting && <p className="text-xs text-center text-[color:var(--owl-text-secondary)]">Submitting to {apiBase}…</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
