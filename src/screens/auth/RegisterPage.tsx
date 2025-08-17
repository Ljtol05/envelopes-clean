import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import RegisterScreen from './RegisterScreen';
import { useAuth } from '../../context/useAuth';

export default function RegisterPage() {
  const { user, token, hydrated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    if (!hydrated) return;
    if (!(user || token)) return;
    if (location.pathname !== '/auth/register') return; // Only auto-redirect off register page itself
    if (user && !user.emailVerified) return; // stay until email verified
    const phoneRequired = (import.meta as unknown as { env?: Record<string,string|undefined> }).env?.VITE_REQUIRE_PHONE_VERIFICATION !== 'false';
    if (phoneRequired && user && !user.phoneVerified) return; // stay until phone verified if required
    redirectedRef.current = true;
    navigate('/', { replace: true });
  }, [hydrated, user, token, navigate, location.pathname]);

  const isRegister = location.pathname.includes('/auth/register');

  return (
    <AuthScaffold subtitle="Create your free account.">
      <div className="space-y-10">
        <RegisterScreen />
        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full max-w-md gap-3 justify-center">
            <Link
              to="/auth/login"
              className={`flex-1 text-center font-medium rounded-lg px-4 py-2 transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--owl-accent)] ${!isRegister ? 'bg-white text-[color:var(--owl-bg)] shadow-[var(--owl-shadow-lg)] border-white' : 'bg-transparent text-white border-white/60 hover:border-white hover:shadow-[var(--owl-shadow-md)]'}`}
            >
              Log in
            </Link>
            <Link
              to="/auth/register"
              className={`flex-1 text-center font-medium rounded-lg px-4 py-2 transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--owl-accent)] ${isRegister ? 'bg-white text-[color:var(--owl-bg)] shadow-[var(--owl-shadow-lg)] border-white' : 'bg-transparent text-white border-white/60 hover:border-white hover:shadow-[var(--owl-shadow-md)]'}`}
              aria-current={isRegister ? 'page' : undefined}
            >
              Create account
            </Link>
          </div>
          <p className="text-center text-xs sm:text-sm text-[color:var(--owl-text-secondary)] select-none">
            Take charge of your money with smart envelopes.
          </p>
        </div>
      </div>
    </AuthScaffold>
  );
}
