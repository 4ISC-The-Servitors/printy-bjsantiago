// Customer Components Barrel Export

// Account Settings - Desktop
export { default as DesktopNotificationPreferences } from './accountSettings/NotificationPreferences';
export { default as DesktopProfileOverviewCard } from './accountSettings/ProfileOverviewCard';
export { default as DesktopSecuritySettings } from './accountSettings/SecuritySettings';
export { default as DesktopPersonalInfoForm } from './accountSettings/PersonalInfoForm';

// Account Settings - Mobile
// Note: Mobile settings components are placeholders (empty files)
// export { default as MobileUserManagementSettings } from './accountSettings/mobile/UserManagementSettings';
// export { default as MobileSecuritySettings } from './accountSettings/mobile/SecuritySettings';
// export { default as MobileSystemPreferences } from './accountSettings/mobile/SystemPreferences';

// Chat History
export { default as ConversationList } from './chatHistory/ConversationList';
export { default as ConversationItem } from './chatHistory/ConversationItem';
export { default as ChatHistoryHeader } from './chatHistory/Header';
export { default as ChatHistoryFilters } from './chatHistory/Filters';

// Dashboard - Chat Cards
export { default as ChatCardsFAQs } from './dashboard/chatCards/FAQs';
export { default as ChatCardsServicesOffered } from './dashboard/chatCards/ServicesOffered';
export { default as ChatCardsAskAssistance } from './dashboard/chatCards/AskAssistance';
export { default as ChatCardsAskQuote } from './dashboard/chatCards/AskQuote';
export { default as ChatCardsAboutUs } from './dashboard/chatCards/AboutUs';
export { default as ChatCards } from './dashboard/chatCards/ChatCards';
export { default as ChatCardsTrackATicket } from './dashboard/chatCards/TrackATicket';
export { default as ChatCardsPlaceAnOrder } from './dashboard/chatCards/PlaceAnOrder';

// Dashboard - Recent Orders
export { default as RecentOrderDateCreated } from './dashboard/recentOrders/DateCreated';
export { default as RecentOrderID } from './dashboard/recentOrders/OrderID';
export { default as RecentOrderStatusBadge } from './dashboard/recentOrders/StatusBadge';
export { default as RecentOrderDateUpdated } from './dashboard/recentOrders/DateUpdated';
export { default as RecentOrderPrice } from './dashboard/recentOrders/Price';
export { default as RecentOrder } from './dashboard/recentOrders/RecentOrder';
export { default as RecentOrderPayNowButton } from './dashboard/recentOrders/PayNowButton';

// Dashboard - Recent Tickets
export { default as RecentTicketSubject } from './dashboard/recentTickets/TicketSubject';
export { default as RecentTicketID } from './dashboard/recentTickets/TicketID';
export { default as RecentTicketTrackButton } from './dashboard/recentTickets/TrackTicketButton';
export { default as RecentTicketDateUpdated } from './dashboard/recentTickets/DateUpdated';
export { default as RecentTicketDateCreated } from './dashboard/recentTickets/DateCreated';
export { default as RecentTicketStatusBadge } from './dashboard/recentTickets/StatusBadge';
export { default as RecentTickets } from './dashboard/recentTickets/RecentTickets';

// Dashboard - Recent Quotes
export { default as RecentQuoteTrackButton } from './dashboard/recentQuotes/TrackQuoteButton';
export { default as RecentQuoteSubject } from './dashboard/recentQuotes/QuoteSubject';
export { default as RecentQuotes } from './dashboard/recentQuotes/RecentQuotes';
export { default as RecentQuoteStatusBadge } from './dashboard/recentQuotes/StatusBadge';
export { default as RecentQuoteID } from './dashboard/recentQuotes/QuoteID';

// Dashboard - History Components
export { default as OrderHistory } from './dashboard/orderHistory/OrderHistory';
export { default as TicketHistory } from './dashboard/ticketHistory/TicketHistory';
export { default as QuoteHistory } from './dashboard/quoteHistory/QuoteHistory';

// Shared - Sidebar
export { default as SidebarAccountButton } from './shared/sidebar/AccountButton';
export { default as SidebarViewAllChat } from './shared/sidebar/ViewAllChat';
export { default as SidebarRecentChats } from './shared/sidebar/RecentChats';
export { default as SidebarLogoutModal } from './shared/sidebar/LogoutModal';
export { default as SidebarLogoutButton } from './shared/sidebar/LogoutButton';
export { default as SidebarPanel } from './shared/sidebar/SidebarPanel';

// Shared - Layouts
export { default as CustomerMobileLayout } from './shared/layouts/MobileLayout';
export { default as CustomerDesktopLayout } from './shared/layouts/DesktopLayout';
