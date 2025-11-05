import React from 'react';
import { Text } from '@shared/components';
import { ShoppingCart } from 'lucide-react';

interface CardProps {
  onClick: () => void;
}

const PlaceAnOrder: React.FC<CardProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1 text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
        <ShoppingCart className="w-6 h-6" />
      </div>
      <Text variant="h3" weight="semibold" className="device-text-heading mb-2">
        Place Order
      </Text>
      <Text variant="p" size="xs" color="muted">
        Place your order — you can also ask a quote this way
      </Text>
    </button>
  );
};

export default PlaceAnOrder;
