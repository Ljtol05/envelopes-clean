import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

interface FormValues { name: string; email: string; password: string }
const EMAIL_RE = /.+@.+\..+/;

export default function RegisterScreen() {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: "", email: "", password: "" } });

  const onSubmit = async (vals: FormValues) => {
    try {
  await doRegister(vals.name, vals.email, vals.password);
  toast.success("Account created");
  // Redirect into KYC flow; that will handle onward navigation once approved
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
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? 'register-name-error' : undefined} autoComplete="name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p id="register-name-error" className="text-xs text-[color:var(--owl-accent)]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'register-email-error' : undefined} autoComplete="email" {...register("email", { required: "Email is required", pattern: { value: EMAIL_RE, message: "Enter a valid email" } })} />
              {errors.email && <p id="register-email-error" className="text-xs text-[color:var(--owl-accent)]">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" aria-invalid={errors.password ? 'true' : undefined} aria-describedby={errors.password ? 'register-password-error' : undefined} autoComplete="new-password" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min length is 6" } })} />
              {errors.password && <p id="register-password-error" className="text-xs text-[color:var(--owl-accent)]">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
