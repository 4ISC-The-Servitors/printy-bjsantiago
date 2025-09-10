export type ServiceItem = {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  category: string;
};

export const mockServices: ServiceItem[] = [
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
    id: 'SRV-CP005',
    name: 'Insurance Form',
    code: 'SRV-CP005',
    status: 'Active',
    category: 'Commercial Forms',
  },
  {
    id: 'SRV-CP011',
    name: 'Company Folder',
    code: 'SRV-CP011',
    status: 'Inactive',
    category: 'Business Forms',
  },
];
