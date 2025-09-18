// Context type definitions for all chat flows

export interface FlowContext {
  // Order-related context
  orderId?: string;
  orderIds?: string[];
  orders?: any[];
  updateOrder?: (id: string, updates: Partial<any>) => void;
  refreshOrders?: () => void;

  // Service-related context
  serviceId?: string;
  serviceIds?: string[];
  services?: any[];
  updateService?: (id: string, updates: Partial<any>) => void;
  refreshServices?: () => void;

  // Ticket-related context
  ticketId?: string;
  ticketIds?: string[];
  tickets?: any[];
  updateTicket?: (id: string, updates: Partial<any>) => void;
  refreshTickets?: () => void;

  // Generic context
  [key: string]: any;
}
