import React from 'react';
import { Text } from '@shared/components';
import { formatLongDate } from '@shared/utils/dateFormatter';

interface DateCreatedProps {
  ts: number;
}

const DateCreated: React.FC<DateCreatedProps> = ({ ts }) => (
  <Text variant="p" size="sm">
    {formatLongDate(ts)}
  </Text>
);

export default DateCreated;


