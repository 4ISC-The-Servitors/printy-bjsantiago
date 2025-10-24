import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LandingPage from './guest/pages/LandingPage';
import SignIn from '@auth/pages/SignIn';
import SignUp from '@auth/pages/SignUp';
import ForgotPassword from '@auth/pages/ForgotPassword';
import ResetPassword from '@auth/pages/ResetPassword';
import CustomerAccountSettings from '@customer/pages/CustomerAccountSettings';
import CustomerRoot from '@customer/pages/CustomerRoot';
import AdminRoot from '@admin/pages/AdminRoot';
import SuperAdminRoot from '@superadmin/pages/SuperAdminRoot';
import { PageLoading } from '@shared/components';
import './index.css';
import { RequireAuth } from '@auth/components/guards/RequireAuth';
import { GuestOnly } from '@auth/components/guards/GuestOnly';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('@admin/pages/Dashboard'));
const AdminOrders = lazy(() => import('@admin/pages/Orders'));
const AdminTickets = lazy(() => import('@admin/pages/Tickets'));
const AdminQuotes = lazy(() => import('@admin/pages/Quotes'));
const AdminSettingsPage = lazy(() => import('@admin/pages/AdminSettings'));
const AdminPortfolio = lazy(() => import('@admin/pages/Portfolio'));
const AdminChats = lazy(() => import('@admin/pages/Chats'));
const SuperAdminDashboard = lazy(() => import('@superadmin/pages/Dashboard'));
const CustomerDashboard = lazy(
  () => import('@customer/pages/CustomerDashboard')
);
const CustomerChatHistory = lazy(
  () => import('@customer/pages/CustomerChatHistory')
);
const CustomerOrderHistory = lazy(
  () => import('@customer/pages/CustomerOrderHistory')
);
const CustomerTicketHistory = lazy(
  () => import('@customer/pages/CustomerTicketHistory')
);
const CustomerQuoteHistory = lazy(
  () => import('@customer/pages/CustomerQuoteHistory')
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/auth/signin"
        element={
          <GuestOnly>
            <SignIn />
          </GuestOnly>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <GuestOnly>
            <SignUp />
          </GuestOnly>
        }
      />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password/confirm" element={<ResetPassword />} />
      <Route
        path="/customer"
        element={
          <RequireAuth allowed={['regular', 'valued']}>
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <CustomerRoot />
            </Suspense>
          </RequireAuth>
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
          <RequireAuth allowed={['valued']}>
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <CustomerDashboard />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth allowed={['admin']}>
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <AdminRoot />
            </Suspense>
          </RequireAuth>
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
          <RequireAuth allowed={['superadmin']}>
            <SuperAdminRoot />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <SuperAdminDashboard />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
