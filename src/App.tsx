import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './guest/pages/LandingPage';
import SignIn from '@auth/pages/SignIn';
import SignUp from '@auth/pages/SignUp';
import ForgotPassword from '@auth/pages/ForgotPassword';
import ResetPassword from '@auth/pages/ResetPassword';
import CustomerAccountSettings from '@customer/pages/CustomerAccountSettings';
import CustomerRoot from '@customer/pages/CustomerRoot';
import CustomerDashboard from '@customer/pages/CustomerDashboard';
import CustomerChatHistory from '@customer/pages/CustomerChatHistory';
import CustomerOrderHistory from '@customer/pages/CustomerOrderHistory';
import CustomerTicketHistory from '@customer/pages/CustomerTicketHistory';
import CustomerQuoteHistory from '@customer/pages/CustomerQuoteHistory';
import AdminRoot from '@admin/pages/AdminRoot';
import AdminDashboard from '@admin/pages/Dashboard';
import AdminOrders from '@admin/pages/Orders';
import AdminTickets from '@admin/pages/Tickets';
import AdminQuotes from '@admin/pages/Quotes';
import AdminPortfolio from '@admin/pages/Portfolio';
import AdminChats from '@admin/pages/Chats';
import AdminSettingsPage from '@admin/pages/AdminSettings';
import SuperAdminRoot from '@superadmin/pages/SuperAdminRoot';
import SuperAdminDashboard from '@superadmin/pages/Dashboard';
import './index.css';
import { RequireAuth } from '@auth/components/guards/RequireAuth';
import { GuestOnly } from '@auth/components/guards/GuestOnly';

// Lazy load heavy components (only less frequently accessed pages)
// Note: CustomerAccountSettings is kept as eager import since it's not lazy loaded

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
            <CustomerRoot />
          </RequireAuth>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="account" element={<CustomerAccountSettings />} />
        <Route path="chats" element={<CustomerChatHistory />} />
        <Route path="orders" element={<CustomerOrderHistory />} />
        <Route path="tickets" element={<CustomerTicketHistory />} />
        <Route path="quotes" element={<CustomerQuoteHistory />} />
      </Route>
      <Route
        path="/valued"
        element={
          <RequireAuth allowed={['valued']}>
            <Navigate to="/customer" replace />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth allowed={['admin']}>
            <AdminRoot />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="quotes" element={<AdminQuotes />} />
        <Route path="portfolio" element={<AdminPortfolio />} />
        <Route path="chats" element={<AdminChats />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
      <Route
        path="/superadmin"
        element={
          <RequireAuth allowed={['superadmin']}>
            <SuperAdminRoot />
          </RequireAuth>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
