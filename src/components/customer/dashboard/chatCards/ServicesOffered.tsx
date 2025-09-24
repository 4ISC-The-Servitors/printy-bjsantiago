import React from 'react';
import { Text } from '../../../shared';
import { Settings } from 'lucide-react';

interface CardProps {
  onClick: () => void;
}

const ServicesOffered: React.FC<CardProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1 text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-brand-accent-50 text-brand-accent flex items-center justify-center mb-4 group-hover:bg-brand-accent group-hover:text-white transition-colors">
        <Settings className="w-6 h-6" />
      </div>
      <Text variant="h3" size="xl" weight="semibold" className="mb-2">
        Services Offered
      </Text>
      <Text variant="p" size="sm" color="muted">
        Browse our printing services and capabilities
      </Text>
    </button>
  );
};

export default ServicesOffered;


