export type ServiceItem = {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive' | 'Retired';
  category: string;
};

export const mockServices: ServiceItem[] = [
  // BIR Registered Forms
  {
    id: 'SRV-CP001',
    name: 'Official Receipt',
    code: 'SRV-CP001',
    status: 'Active',
    category: 'BIR Registered Forms',
  },
  {
    id: 'SRV-CP002',
    name: 'Sales Invoice',
    code: 'SRV-CP002',
    status: 'Active',
    category: 'BIR Registered Forms',
  },
  {
    id: 'SRV-CP003',
    name: 'Purchase Order',
    code: 'SRV-CP003',
    status: 'Inactive',
    category: 'BIR Registered Forms',
  },
  {
    id: 'SRV-CP004',
    name: 'Delivery Receipt',
    code: 'SRV-CP004',
    status: 'Retired',
    category: 'BIR Registered Forms',
  },
  
  // Commercial Forms
  {
    id: 'SRV-CP005',
    name: 'Insurance Form',
    code: 'SRV-CP005',
    status: 'Active',
    category: 'Commercial Forms',
  },
  {
    id: 'SRV-CP006',
    name: 'Application Form',
    code: 'SRV-CP006',
    status: 'Active',
    category: 'Commercial Forms',
  },
  {
    id: 'SRV-CP007',
    name: 'Registration Form',
    code: 'SRV-CP007',
    status: 'Inactive',
    category: 'Commercial Forms',
  },
  
  // Business Forms
  {
    id: 'SRV-CP011',
    name: 'Company Folder',
    code: 'SRV-CP011',
    status: 'Inactive',
    category: 'Business Forms',
  },
  {
    id: 'SRV-CP012',
    name: 'Business Card',
    code: 'SRV-CP012',
    status: 'Active',
    category: 'Business Forms',
  },
  {
    id: 'SRV-CP013',
    name: 'Letterhead',
    code: 'SRV-CP013',
    status: 'Active',
    category: 'Business Forms',
  },
  {
    id: 'SRV-CP014',
    name: 'Envelope',
    code: 'SRV-CP014',
    status: 'Retired',
    category: 'Business Forms',
  },
  
  // Commercial Printing
  {
    id: 'SRV-CO001',
    name: 'Brochures',
    code: 'SRV-CO001',
    status: 'Active',
    category: 'Commercial Printing',
  },
  {
    id: 'SRV-CO002',
    name: 'Flyers',
    code: 'SRV-CO002',
    status: 'Active',
    category: 'Commercial Printing',
  },
  {
    id: 'SRV-CO003',
    name: 'Posters',
    code: 'SRV-CO003',
    status: 'Inactive',
    category: 'Commercial Printing',
  },
  {
    id: 'SRV-CO004',
    name: 'Banners',
    code: 'SRV-CO004',
    status: 'Active',
    category: 'Commercial Printing',
  },
  
  // Packaging
  {
    id: 'SRV-PK001',
    name: 'Soap Box',
    code: 'SRV-PK001',
    status: 'Active',
    category: 'Packaging',
  },
  {
    id: 'SRV-PK002',
    name: 'Coffee / Tea Box',
    code: 'SRV-PK002',
    status: 'Active',
    category: 'Packaging',
  },
  {
    id: 'SRV-PK003',
    name: 'Pharmaceutical Box',
    code: 'SRV-PK003',
    status: 'Active',
    category: 'Packaging',
  },
  {
    id: 'SRV-PK004',
    name: 'Paper Bag',
    code: 'SRV-PK004',
    status: 'Inactive',
    category: 'Packaging',
  },
  {
    id: 'SRV-PK005',
    name: 'Hang Tag',
    code: 'SRV-PK005',
    status: 'Retired',
    category: 'Packaging',
  },
  
  // Digital Printing
  {
    id: 'SRV-DP001',
    name: 'Photo Prints',
    code: 'SRV-DP001',
    status: 'Active',
    category: 'Digital Printing',
  },
  {
    id: 'SRV-DP002',
    name: 'Canvas Prints',
    code: 'SRV-DP002',
    status: 'Retired',
    category: 'Digital Printing',
  },
  {
    id: 'SRV-DP003',
    name: 'Stickers',
    code: 'SRV-DP003',
    status: 'Active',
    category: 'Digital Printing',
  },
  {
    id: 'SRV-DP004',
    name: 'Labels',
    code: 'SRV-DP004',
    status: 'Active',
    category: 'Digital Printing',
  },
  
  // Large Format Printing
  {
    id: 'SRV-LF001',
    name: 'Signage',
    code: 'SRV-LF001',
    status: 'Active',
    category: 'Large Format Printing',
  },
  {
    id: 'SRV-LF002',
    name: 'Vehicle Wraps',
    code: 'SRV-LF002',
    status: 'Inactive',
    category: 'Large Format Printing',
  },
  {
    id: 'SRV-LF003',
    name: 'Window Graphics',
    code: 'SRV-LF003',
    status: 'Active',
    category: 'Large Format Printing',
  },
];

// Helper functions for filtering services
export const getPortfolioServices = (): ServiceItem[] => {
  return mockServices; // Portfolio shows all services (Active, Inactive, Retired)
};

export const getServicesOffered = (): ServiceItem[] => {
  return mockServices.filter(service => service.status === 'Active'); // Services Offered shows only Active services
};

export const getServicesByCategory = (services: ServiceItem[]) => {
  const categoryMap = new Map<string, ServiceItem[]>();
  services.forEach(service => {
    const category = service.category || 'Uncategorized';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(service);
  });
  
  return Array.from(categoryMap.entries()).map(([name, services]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    count: services.length,
    services: services.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      status: s.status as 'Active' | 'Inactive' | 'Retired'
    }))
  }));
};
