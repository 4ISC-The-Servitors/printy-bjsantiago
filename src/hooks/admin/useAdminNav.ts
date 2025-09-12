import { useNavigate } from 'react-router-dom';

export type AdminRoute = 'dashboard' | 'orders' | 'tickets' | 'portfolio' | 'settings';

export interface UseAdminNavReturn {
  go: (route: AdminRoute) => void;
}

export const useAdminNav = (): UseAdminNavReturn => {
  const navigate = useNavigate();

  const go = (route: AdminRoute) => {
    if (route === 'dashboard') navigate('/admin');
    if (route === 'orders') navigate('/admin/orders');
    if (route === 'tickets') navigate('/admin/tickets');
    if (route === 'portfolio') navigate('/admin/portfolio');
    if (route === 'settings') navigate('/admin/settings');
  };

  return { go };
};

export default useAdminNav;


