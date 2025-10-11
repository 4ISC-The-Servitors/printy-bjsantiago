import React from 'react';
import { Text } from '../../../shared';
import { Calculator } from 'lucide-react';

interface CardProps {
  onClick: () => void;
}

const AskQuote: React.FC<CardProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1 text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
        <Calculator className="w-6 h-6" />
      </div>
      <Text variant="h3" size="xl" weight="semibold" className="mb-2">
        Ask Quote
      </Text>
      <Text variant="p" size="sm" color="muted">
        Get a personalized quote for your printing needs with our AI assistant
      </Text>
    </button>
  );
};

export default AskQuote;
