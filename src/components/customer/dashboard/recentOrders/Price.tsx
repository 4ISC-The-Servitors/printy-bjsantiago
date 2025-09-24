import React from 'react';
import { Text } from '../../../shared';
import { formatCurrency, extractNumericValue } from '../../../../utils/shared';

interface PriceProps {
  total?: string;
}

const Price: React.FC<PriceProps> = ({ total }) => (
  <Text variant="p" size="2xl" weight="semibold" className="tracking-tight">
    {formatCurrency(extractNumericValue(total || '₱0'))}
  </Text>
);

export default Price;


