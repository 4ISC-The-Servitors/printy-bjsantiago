import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/customer/Dashboard';
import AccountSettingsPage from './pages/customer/accountSettings/AccountSettingsPage';
import AdminDashboard from './pages/admin/Dashboard';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import './index.css';
import ComponentShowcase from './components/shared/showcase/ComponentShowcase';

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
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/showcase" element={<ComponentShowcase />} />
    </Routes>
  );
}

export default App;
