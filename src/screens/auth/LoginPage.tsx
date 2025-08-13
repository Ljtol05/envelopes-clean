import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import LoginScreen from './LoginScreen';
import { useAuth } from '../../context/useAuth';

export default function LoginPage() {
  const { user, token, hydrated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (hydrated && (user || token)) navigate('/', { replace: true });
  }, [hydrated, user, token, navigate]);

  const isLogin = location.pathname.includes('/auth/login');

  return (
    <AuthScaffold subtitle="Welcome back to budgeting that feels right.">
      <div className="space-y-10">
        <LoginScreen />
        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full max-w-md gap-3 justify-center">
            <Link
              to="/auth/login"
              className={`flex-1 text-center font-medium rounded-lg px-4 py-2 transition shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--owl-accent)] ${isLogin ? 'bg-white text-[color:var(--owl-bg)] shadow-[var(--owl-shadow-lg)]' : 'bg-transparent text-[color:var(--owl-text-secondary)] hover:text-[color:var(--owl-text-primary)]'}`}
              aria-current={isLogin ? 'page' : undefined}
            >
              Log in
            </Link>
            <Link
              to="/auth/register"
              className={`flex-1 text-center font-medium rounded-lg px-4 py-2 transition shadow-[var(--owl-shadow-md)] border border-[color:var(--owl-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--owl-accent)] ${!isLogin ? 'bg-white text-[color:var(--owl-bg)] shadow-[var(--owl-shadow-lg)]' : 'bg-transparent text-[color:var(--owl-text-secondary)] hover:text-[color:var(--owl-text-primary)]'}`}
            >
              Create account
            </Link>
          </div>
          <p className="text-center text-xs sm:text-sm text-[color:var(--owl-text-secondary)] select-none">
            Your AI budgeting ally
          </p>
        </div>
      </div>
    </AuthScaffold>
  );
}
