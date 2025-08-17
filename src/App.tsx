import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

// --- Shell chrome (relative paths) ---
import { TopAppBar } from "./components/domain/TopAppBar";
import { BottomNavigation } from "./components/domain/BottomNavigation";

// Toasts
import { Toaster } from "sonner";

// --- Screens ---
import { HomeScreen } from "./screens/Mobile/HomeScreen";
import { CardScreen } from "./screens/Mobile/CardScreen";
import { RulesScreen } from "./screens/Mobile/RulesScreen";
import { ActivityScreen } from "./screens/Mobile/ActivityScreen";
import { SettingsScreen } from "./screens/Mobile/SettingsScreen";
import { TransactionDetailsScreen } from "./screens/Mobile/TransactionDetailsScreen";
import { EnvelopesProvider } from './contexts/EnvelopesContext';
import AuthProvider from './context/AuthContext';
import ApiBaseBanner from './components/system/ApiBaseBanner';
import ProtectedRoute from './routes/ProtectedRoute';
import VerificationGuard from './routes/VerificationGuard';
import KycGuard from './routes/KycGuard';
import KycScreen from './screens/auth/KycScreen';
import LoginPage from './screens/auth/LoginPage';
import RegisterPage from './screens/auth/RegisterPage';
import VerifyEmailPage from './screens/auth/VerifyEmailPage';
import OnboardingRedirect from './routes/OnboardingRedirect';
import PhoneVerificationPage from './screens/auth/PhoneVerificationPage';
import ForgotPassword from './screens/auth/ForgotPassword';
import AuthScaffold from './screens/auth/AuthScaffold';
import OnboardingCoach from './screens/OnboardingCoach';
import DevApiSwitcher from './components/system/DevApiSwitcher';
// Endpoint diagnostics (dev only, gated by VITE_SHOW_ENDPOINT_DIAGNOSTICS=true)
import EndpointDiagnostics from './components/system/EndpointDiagnostics';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Map pathnames to tab ids
  const pathToTab: Record<string, 'home' | 'card' | 'rules' | 'activity' | 'settings'> = {
    '/home': 'home',
    '/card': 'card',
    '/rules': 'rules',
    '/activity': 'activity',
    '/settings': 'settings',
  };

  // Determine active tab from current pathname
  const activeTab = pathToTab[location.pathname] || 'home';

  // Handler to change route when tab is clicked
  const handleTabChange = (tab: 'home' | 'card' | 'rules' | 'activity' | 'settings') => {
    navigate(`/${tab}`);
  };

  const hideChrome = location.pathname.startsWith('/auth/kyc');
  return (
    <div className="min-h-dvh bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)]">
      {!hideChrome && <TopAppBar />}
      <main className={hideChrome ? 'bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)]' : 'pb-20 bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)]'}>
        <Outlet />
      </main>
      {!hideChrome && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
      <Toaster richColors position="top-center" />
    </div>
  );
}

// Wrapper to inject the required onBack prop into the details screen
function TxRoute() {
  const navigate = useNavigate();
  return <TransactionDetailsScreen onBack={() => navigate(-1)} />;
}

export default function App() {
  return (
  <AuthProvider>
      <EnvelopesProvider mockLatencyMs={[120,300]}>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/forgot" element={<AuthScaffold><ForgotPassword /></AuthScaffold>} />
            <Route element={<AppLayout />}> {/* shared chrome */}
              <Route element={<ProtectedRoute />}> {/* protected app (auth) */}
                <Route element={<VerificationGuard />}> {/* require email/phone verified */}
                  <Route path="/auth/kyc" element={<KycScreen />} />
                  <Route path="/kyc" element={<Navigate to="/auth/kyc" replace />} />
                  <Route element={<KycGuard />}> {/* KYC approved only */}
                  <Route path="/onboarding/coach" element={<OnboardingCoach />} />
                  <Route index element={<OnboardingRedirect />} />
                  <Route path="/home" element={<HomeScreen />} />
                  <Route path="/card" element={<CardScreen />} />
                  <Route path="/rules" element={<RulesScreen />} />
                  <Route path="/activity" element={<ActivityScreen />} />
                  <Route path="/settings" element={<SettingsScreen />} />
                  <Route path="/tx/:id" element={<TxRoute />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Routes>
  </BrowserRouter>
  <ApiBaseBanner />
  <DevApiSwitcher />
  <EndpointDiagnostics />
      </EnvelopesProvider>
    </AuthProvider>
  );
}