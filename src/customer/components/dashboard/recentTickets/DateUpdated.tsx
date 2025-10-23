import React from 'react';
import { Text } from '@shared/components';
import { formatShortDate } from '@shared/utils/dateFormatter';

interface DateUpdatedProps {
  ts: number;
}

const DateUpdated: React.FC<DateUpdatedProps> = ({ ts }) => (
  <Text variant="p" size="sm">
    {formatShortDate(ts)}
  </Text>
);

export default DateUpdated;
