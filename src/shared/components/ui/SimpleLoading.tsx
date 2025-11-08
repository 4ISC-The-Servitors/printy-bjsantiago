import React from 'react';
import { Loader2 } from 'lucide-react';

interface SimpleLoadingProps {
  text?: string;
  className?: string;
}

export const SimpleLoading: React.FC<SimpleLoadingProps> = ({
  text = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Loader2 className="animate-spin h-4 w-4 mr-2" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};
