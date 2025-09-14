// Data update utilities for all chat flows

export interface UpdateRefs {
  updateOrder?: (id: string, updates: Partial<any>) => void;
  updateService?: (id: string, updates: Partial<any>) => void;
  updateTicket?: (id: string, updates: Partial<any>) => void;
  refreshOrders?: () => void;
  refreshServices?: () => void;
  refreshTickets?: () => void;
}

export interface MockData {
  orders?: any[];
  services?: any[];
  tickets?: any[];
}

export function updateOrderData(
  orderId: string,
  updates: Partial<any>,
  refs: UpdateRefs,
  mockData: MockData
): void {
  // Update via ref if available
  if (refs.updateOrder) {
    refs.updateOrder(orderId, updates);
  }

  // Update mock data
  if (mockData.orders) {
    const index = mockData.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      mockData.orders[index] = { ...mockData.orders[index], ...updates };
    }
  }

  // Refresh if available
  if (refs.refreshOrders) {
    refs.refreshOrders();
  }
}

export function updateServiceData(
  serviceId: string,
  updates: Partial<any>,
  refs: UpdateRefs,
  mockData: MockData
): void {
  // Update via ref if available
  if (refs.updateService) {
    refs.updateService(serviceId, updates);
  }

  // Update mock data
  if (mockData.services) {
    const index = mockData.services.findIndex(s => s.id === serviceId);
    if (index !== -1) {
      mockData.services[index] = { ...mockData.services[index], ...updates };
    }
  }

  // Refresh if available
  if (refs.refreshServices) {
    refs.refreshServices();
  }
}

export function updateTicketData(
  ticketId: string,
  updates: Partial<any>,
  refs: UpdateRefs,
  mockData: MockData
): void {
  // Update via ref if available
  if (refs.updateTicket) {
    refs.updateTicket(ticketId, updates);
  }

  // Update mock data
  if (mockData.tickets) {
    const index = mockData.tickets.findIndex(t => t.id === ticketId);
    if (index !== -1) {
      mockData.tickets[index] = { ...mockData.tickets[index], ...updates };
    }
  }

  // Refresh if available
  if (refs.refreshTickets) {
    refs.refreshTickets();
  }
}
