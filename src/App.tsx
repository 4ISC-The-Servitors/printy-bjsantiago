import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/customer/Dashboard';
import AccountSettingsPage from './pages/customer/accountSettings/AccountSettingsPage';
import DashboardLayout from './components/admin/dashboard/DashboardLayout';
import OrdersDesktopLayout from './components/admin/orders/desktop/OrdersDesktopLayout';
// TicketsLayout removed; tickets page handles layout internally
import SettingsLayout from './components/admin/settings/SettingsLayout';
import './index.css';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminTickets = lazy(() => import('./pages/admin/Tickets'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPortfolio = lazy(() => import('./pages/admin/Portfolio'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const ComponentShowcase = lazy(
  () => import('./components/shared/showcase/ComponentShowcase')
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password/confirm" element={<ResetPassword />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/valued" element={<CustomerDashboard />} />
      <Route path="/account" element={<AccountSettingsPage />} />
      <Route
        path="/admin"
        element={
          <DashboardLayout>
            <Suspense fallback={<div>Loading...</div>}>
              <AdminDashboard />
            </Suspense>
          </DashboardLayout>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <OrdersDesktopLayout />
          </Suspense>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <AdminTickets />
          </Suspense>
        }
      />
      <Route
        path="/admin/portfolio"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <AdminPortfolio />
          </Suspense>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <SettingsLayout>
            <Suspense fallback={<div>Loading...</div>}>
              <AdminSettingsPage />
            </Suspense>
          </SettingsLayout>
        }
      />
      <Route
        path="/superadmin"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <SuperAdminDashboard />
          </Suspense>
        }
      />
      <Route
        path="/showcase"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <ComponentShowcase />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
