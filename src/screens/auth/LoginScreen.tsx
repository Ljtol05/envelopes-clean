import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (vals: FormValues) => {
    try {
      const hadPrevious = !!localStorage.getItem("auth_token");
      await login(vals.email, vals.password);
      toast.success("Welcome back!");
      if (!hadPrevious) navigate("/onboarding/coach", { replace: true });
      else navigate(from || "/", { replace: true });
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Login failed");
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
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" aria-invalid={errors.password ? 'true' : undefined} aria-describedby={errors.password ? 'login-password-error' : undefined} autoComplete="current-password" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min length is 6" } })} />
              {errors.password && <p id="login-password-error" className="text-xs text-[color:var(--owl-accent)]">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            {isSubmitting && <p className="text-xs text-center text-[color:var(--owl-text-secondary)]">Contacting {apiBase}…</p>}
          </form>
          <div className="mt-3 text-center">
            <Link to="/auth/forgot" className="text-sm text-[color:var(--owl-accent)] hover:underline">Forgot password?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
