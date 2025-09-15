export type AdminNavItem = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  exact?: boolean;
};

export const adminMainNav: AdminNavItem[] = [
  { label: 'Dashboard', path: '/admin', exact: true },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Tickets', path: '/admin/tickets' },
  { label: 'Portfolio', path: '/admin/portfolio' },
];

export const adminUtilityNav: AdminNavItem[] = [
  { label: 'Settings', path: '/admin/settings' },
];
