import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/customer/Dashboard';
import AccountSettings from './pages/customer/AccountSettings';
import CustomerRoot from './pages/customer/CustomerRoot';
import CustomerChatHistory from './pages/customer/ChatHistory';
import AdminRoot from './pages/admin/AdminRoot';
import { PageLoading } from './components/shared';
import './index.css';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminTickets = lazy(() => import('./pages/admin/Tickets'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPortfolio = lazy(() => import('./pages/admin/Portfolio'));
const AdminChats = lazy(() => import('./pages/admin/Chats'));
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
      <Route path="/customer" element={<CustomerRoot />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="chats" element={<CustomerChatHistory />} />
      </Route>
      <Route path="/valued" element={<CustomerDashboard />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<PageLoading variant="dashboard" />}>
            <AdminRoot />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <AdminOrders />
            </Suspense>
          }
        />
        <Route
          path="tickets"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <AdminTickets />
            </Suspense>
          }
        />
        <Route
          path="portfolio"
          element={
            <Suspense fallback={<PageLoading variant="grid" />}>
              <AdminPortfolio />
            </Suspense>
          }
        />
        <Route
          path="chats"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <AdminChats />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageLoading variant="form" />}>
              <AdminSettingsPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/superadmin"
        element={
          <Suspense fallback={<PageLoading variant="dashboard" />}>
            <SuperAdminDashboard />
          </Suspense>
        }
      />
      <Route
        path="/showcase"
        element={
          <Suspense fallback={<PageLoading variant="minimal" />}>
            <ComponentShowcase />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
