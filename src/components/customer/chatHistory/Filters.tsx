import React from 'react';
import { Input, Button } from '../../shared';

interface FiltersProps {
  query: string;
  onQueryChange: (v: string) => void;
  status?: string;
  onStatusChange?: (v: string) => void;
  onClear?: () => void;
}

const Filters: React.FC<FiltersProps> = ({ query, onQueryChange, onStatusChange, status, onClear }) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="flex-1">
        <Input
          placeholder="Search conversations..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
        />
      </div>
      {onStatusChange ? (
        <select
          value={status || ''}
          onChange={e => onStatusChange(e.target.value)}
          className="input h-10 px-3"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
      ) : null}
      <Button variant="ghost" onClick={onClear}>Clear</Button>
    </div>
  );
};

export default Filters;


