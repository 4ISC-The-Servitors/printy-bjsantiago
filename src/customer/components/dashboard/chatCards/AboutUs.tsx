import React from 'react';
import { Text } from '@shared/components';
import { Info } from 'lucide-react';

interface CardProps {
  onClick: () => void;
}

const AboutUs: React.FC<CardProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1 text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-brand-accent-50 text-brand-accent flex items-center justify-center mb-4 group-hover:bg-brand-accent group-hover:text-white transition-colors">
        <Info className="w-6 h-6" />
      </div>
      <Text variant="h3" weight="semibold" className="device-text-heading mb-2">
        About B.J. Santiago Inc.
      </Text>
      <Text variant="p" size="xs" color="muted">
        Learn about B.J. Santiago Inc.
      </Text>
    </button>
  );
};

export default AboutUs;
