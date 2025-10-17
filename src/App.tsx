import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerAccountSettings from './pages/customer/CustomerAccountSettings';
import CustomerRoot from './pages/customer/CustomerRoot';
import CustomerChatHistory from './pages/customer/CustomerChatHistory';
import AdminRoot from './pages/admin/AdminRoot';
import { PageLoading } from './components/shared';
import './index.css';

// ✅ Toast system
import { ToastContainer } from './components/shared';
import { useToast } from './lib/useToast';

// ✅ Supabase client
import { supabase } from './lib/supabase';

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
  // ✅ Toast system
  const [toasts, toast] = useToast();

  // ✅ Supabase Realtime Notification Listener
  useEffect(() => {
    console.log('🔌 Connecting to Supabase Realtime...');

    // --- ORDERS TABLE ---
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📦 Order change detected:', payload);

          const displayId =
            (payload.new as any)?.display_id || (payload.new as any)?.order_id;

          if (payload.eventType === 'INSERT') {
            toast.success('New Order', `Order ${displayId} was created.`);
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Order Updated', `Order ${displayId} has been updated.`);
          }
        }
      )
      .subscribe((status) =>
        console.log('✅ Orders channel status:', status)
      );

    // --- INQUIRIES TABLE (Tickets) ---
    const inquiriesChannel = supabase
      .channel('inquiries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        (payload) => {
          console.log('🎫 Inquiry change detected:', payload);

          const displayId =
            (payload.new as any)?.display_id || (payload.new as any)?.inquiry_id;

          if (payload.eventType === 'INSERT') {
            toast.success(
              'New Ticket',
              `Your ticket ${displayId} has been submitted.`
            );
          } else if (payload.eventType === 'UPDATE') {
            toast.info(
              'Ticket Update',
              `Ticket ${displayId} has a new update.`
            );
          }
        }
      )
      .subscribe((status) =>
        console.log('✅ Inquiries channel status:', status)
      );

    // --- Cleanup ---
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(inquiriesChannel);
    };
  }, [toast]);

  return (
    <>
      {/* 🌐 Application Routes */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/confirm" element={<ResetPassword />} />

        {/* 🧭 Customer Routes */}
        <Route path="/customer" element={<CustomerRoot />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="account" element={<CustomerAccountSettings />} />
          <Route path="chats" element={<CustomerChatHistory />} />
        </Route>

        <Route path="/valued" element={<CustomerDashboard />} />

        {/* 🧭 Admin Routes */}
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

        {/* 🧭 Super Admin */}
        <Route
          path="/superadmin"
          element={
            <Suspense fallback={<PageLoading variant="dashboard" />}>
              <SuperAdminDashboard />
            </Suspense>
          }
        />

        {/* 🧭 Component Showcase */}
        <Route
          path="/showcase"
          element={
            <Suspense fallback={<PageLoading variant="minimal" />}>
              <ComponentShowcase />
            </Suspense>
          }
        />
      </Routes>

      {/* ✅ Global Toast Renderer */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position="top-right"
      />
    </>
  );
}

export default App;

