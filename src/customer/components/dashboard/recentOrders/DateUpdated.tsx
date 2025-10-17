import React from 'react';
import { Text } from '@shared/components';
import { formatLongDate } from '@shared/utils/dateFormatter';

interface DateUpdatedProps {
  ts: number;
}

const DateUpdated: React.FC<DateUpdatedProps> = ({ ts }) => (
  <Text variant="p" size="sm">
    {formatLongDate(ts)}
  </Text>
);

export default DateUpdated;


