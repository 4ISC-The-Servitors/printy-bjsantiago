import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/customer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import './index.css';
import Showcase from './pages/Showcase';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      {/* Prototype dashboards */}
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/valued" element={<CustomerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/showcase" element={<Showcase />} />
    </Routes>
  );
}

export default App;