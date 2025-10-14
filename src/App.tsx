import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerAccountSettings from './pages/customer/CustomerAccountSettings';
import CustomerRoot from './pages/customer/CustomerRoot';
import AdminRoot from './pages/admin/AdminRoot';
import { PageLoading } from './components/shared';
import './index.css';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminTickets = lazy(() => import('./pages/admin/Tickets'));
const AdminQuotes = lazy(() => import('./pages/admin/Quotes'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPortfolio = lazy(() => import('./pages/admin/Portfolio'));
const AdminChats = lazy(() => import('./pages/admin/Chats'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const ComponentShowcase = lazy(
  () => import('./components/shared/showcase/ComponentShowcase')
);
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerChatHistory = lazy(() => import('./pages/customer/CustomerChatHistory'));
const CustomerOrderHistory = lazy(() => import('./pages/customer/CustomerOrderHistory'));
const CustomerTicketHistory = lazy(() => import('./pages/customer/CustomerTicketHistory'));
const CustomerQuoteHistory = lazy(() => import('./pages/customer/CustomerQuoteHistory'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password/confirm" element={<ResetPassword />} />
      <Route
        path="/customer"
        element={
          <Suspense fallback={<PageLoading variant="dashboard" />}>
            <CustomerRoot />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <CustomerDashboard />
            </Suspense>
          }
        />
        <Route path="account" element={<CustomerAccountSettings />} />
        <Route
          path="chats"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <CustomerChatHistory />
            </Suspense>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <CustomerOrderHistory />
            </Suspense>
          }
        />
        <Route
          path="tickets"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <CustomerTicketHistory />
            </Suspense>
          }
        />
        <Route
          path="quotes"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <CustomerQuoteHistory />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/valued"
        element={
          <Suspense fallback={<PageLoading variant="dashboard" />}>
            <CustomerDashboard />
          </Suspense>
        }
      />
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
          path="quotes"
          element={
            <Suspense fallback={<PageLoading variant="list" />}>
              <AdminQuotes />
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
