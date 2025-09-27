import React from 'react';
import { Text } from '../../../shared';
import { formatLongDate } from '../../../../utils/shared';

interface DateCreatedProps {
  ts: number;
}

const DateCreated: React.FC<DateCreatedProps> = ({ ts }) => (
  <Text variant="p" size="sm">
    {formatLongDate(ts)}
  </Text>
);

export default DateCreated;


