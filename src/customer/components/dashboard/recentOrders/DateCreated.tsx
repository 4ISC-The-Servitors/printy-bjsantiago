import React from 'react';
import { Text } from '@shared/components';
import { formatShortDate } from '@shared/utils/dateFormatter';

interface DateCreatedProps {
  ts: number;
}

const DateCreated: React.FC<DateCreatedProps> = ({ ts }) => (
  <Text variant="p" size="sm">
    {formatShortDate(ts)}
  </Text>
);

export default DateCreated;
