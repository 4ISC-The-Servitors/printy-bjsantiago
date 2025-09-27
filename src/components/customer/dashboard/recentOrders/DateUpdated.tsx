import React from 'react';
import { Text } from '../../../shared';
import { formatLongDate } from '../../../../utils/shared';

interface DateUpdatedProps {
  ts: number;
}

const DateUpdated: React.FC<DateUpdatedProps> = ({ ts }) => (
  <Text variant="p" size="sm">
    {formatLongDate(ts)}
  </Text>
);

export default DateUpdated;


