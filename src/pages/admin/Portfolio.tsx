import React, { useState, useEffect } from 'react';
import PortfolioMobileLayout from '../../components/admin/portfolio/mobile/PortfolioMobileLayout';
import PortfolioDesktopLayout from '../../components/admin/portfolio/desktop/PortfolioDesktopLayout';
import { useAdmin } from './AdminContext';
import { useToast } from '../../components/shared';

interface Service {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive' | 'Retired';
}

interface ServiceCategory {
  id: string;
  name: string;
  count: number;
  services: Service[];
}

// Mock data - in a real app, this would come from an API
const mockPortfolioData: ServiceCategory[] = [
  {
    id: 'commercial',
    name: 'Commercial Printing',
    count: 25,
    services: [
      {
        id: 'cp001',
        name: 'Business Cards',
        code: 'SRV-CP001',
        status: 'Active',
      },
      { id: 'cp002', name: 'Brochures', code: 'SRV-CP002', status: 'Active' },
      { id: 'cp003', name: 'Flyers', code: 'SRV-CP003', status: 'Inactive' },
    ],
  },
  {
    id: 'packaging',
    name: 'Packaging',
    count: 5,
    services: [
      { id: 'pk001', name: 'Soap Box', code: 'SRV-PK001', status: 'Active' },
      {
        id: 'pk002',
        name: 'Coffee / Tea Box',
        code: 'SRV-PK002',
        status: 'Active',
      },
      {
        id: 'pk003',
        name: 'Pharmaceutical Box',
        code: 'SRV-PK003',
        status: 'Active',
      },
      { id: 'pk004', name: 'Paper Bag', code: 'SRV-PK004', status: 'Inactive' },
      { id: 'pk005', name: 'Hang Tag', code: 'SRV-PK005', status: 'Active' },
    ],
  },
  {
    id: 'digital',
    name: 'Digital Printing',
    count: 5,
    services: [
      {
        id: 'dp001',
        name: 'Photo Prints',
        code: 'SRV-DP001',
        status: 'Active',
      },
      {
        id: 'dp002',
        name: 'Canvas Prints',
        code: 'SRV-DP002',
        status: 'Retired',
      },
    ],
  },
  {
    id: 'large-format',
    name: 'Large Format Printing',
    count: 5,
    services: [
      { id: 'lf001', name: 'Banners', code: 'SRV-LF001', status: 'Active' },
      { id: 'lf002', name: 'Posters', code: 'SRV-LF002', status: 'Inactive' },
    ],
  },
];

const mockServicesOffered: ServiceCategory[] = [
  {
    id: 'commercial-offered',
    name: 'Commercial Printing',
    count: 19,
    services: [
      { id: 'co001', name: 'Letterheads', code: 'SRV-CO001', status: 'Active' },
      { id: 'co002', name: 'Envelopes', code: 'SRV-CO002', status: 'Active' },
    ],
  },
  {
    id: 'packaging-offered',
    name: 'Packaging',
    count: 4,
    services: [
      { id: 'po001', name: 'Gift Boxes', code: 'SRV-PO001', status: 'Active' },
      {
        id: 'po002',
        name: 'Food Containers',
        code: 'SRV-PO002',
        status: 'Active',
      },
    ],
  },
  {
    id: 'digital-offered',
    name: 'Digital Printing',
    count: 4,
    services: [
      { id: 'do001', name: 'Stickers', code: 'SRV-DO001', status: 'Active' },
      { id: 'do002', name: 'Labels', code: 'SRV-DO002', status: 'Active' },
    ],
  },
  {
    id: 'large-format-offered',
    name: 'Large Format Printing',
    count: 4,
    services: [
      { id: 'lo001', name: 'Signage', code: 'SRV-LO001', status: 'Active' },
      {
        id: 'lo002',
        name: 'Vehicle Wraps',
        code: 'SRV-LO002',
        status: 'Active',
      },
    ],
  },
];

const AdminPortfolio: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const { addSelected, openChat, selected } = useAdmin();
  const [, toast] = useToast();

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024); // Using lg breakpoint like existing code
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleServiceSelect = (service: Service) => {
    if (selectedServices.includes(service.id)) {
      setSelectedServices(selectedServices.filter(id => id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service.id]);
    }
  };

  const handleViewInChat = (service: Service) => {
    addSelected({
      id: service.id,
      label: service.name,
      type: 'service',
    });
    openChat();
  };

  const handleAddToChat = () => {
    const hasDifferentEntity = selected.some(
      s => s.type && s.type !== 'service'
    );
    if (hasDifferentEntity) {
      toast.error(
        'Cannot mix entities',
        'You have non-Service items selected. Clear selection first.'
      );
      return;
    }
    selectedServices.forEach(serviceId => {
      const allServices = [
        ...mockPortfolioData,
        ...mockServicesOffered,
      ].flatMap(cat => cat.services);
      const service = allServices.find(s => s.id === serviceId);
      if (service) {
        addSelected({
          id: service.id,
          label: service.name,
          type: 'service',
        });
      }
    });
    setSelectedServices([]);
    openChat();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'Retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const commonProps = {
    mockPortfolioData,
    mockServicesOffered,
    selectedServices,
    setSelectedServices,
    handleServiceSelect,
    handleViewInChat,
    handleAddToChat,
    getStatusColor,
  };

  return isMobile ? (
    <PortfolioMobileLayout {...commonProps} />
  ) : (
    <PortfolioDesktopLayout {...commonProps} />
  );
};

export default AdminPortfolio;
