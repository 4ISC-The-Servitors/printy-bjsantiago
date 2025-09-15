// Cards and components barrel

// Orders
export { default as OrdersDesktopCard } from './orders/desktop/OrdersCard';
export { default as OrdersMobileCard } from './orders/mobile/OrdersCard';

// Tickets
export { default as TicketsDesktopCard } from './tickets/desktop/TicketsCard';
export { default as TicketsMobileCard } from './tickets/mobile/TicketsCard';

// Portfolio
export { default as PortfolioDesktopCard } from './portfolio/desktop/PortfolioCard';
export { default as PortfolioMobileCard } from './portfolio/mobile/PortfolioCard';

// Shared selection adapter
export { default as AdminSelectionHandler } from './_shared/AdminSelectionHandler';

// Layouts (single barrel)
export { default as AdminLayout } from './layouts/AdminLayout';
export { default as AdminMobileLayout } from './layouts/AdminMobileLayout';
export { default as SettingsLayout } from './settings/SettingsLayout';
export * from './layouts/adminNav';

// Mobile chrome (Admin-prefixed aliases from _shared/mobile)
export {
  AdminMobileHeader,
  AdminMobileSidebar,
  AdminMobileCardMenu,
  AdminMobileSelectionMode,
} from './_shared/mobile';
