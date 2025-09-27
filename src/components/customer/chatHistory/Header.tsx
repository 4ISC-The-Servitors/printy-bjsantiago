import React from 'react';
import { Text, Button } from '../../shared';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'Chat History', subtitle, onBack }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-1">
        {onBack && (
          <Button
            onClick={onBack}
            variant="secondary"
            size="sm"
            threeD
            className="h-9 w-9 p-0 flex items-center justify-center"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Text variant="h1" size="2xl" weight="bold">
          {title}
        </Text>
      </div>
      {subtitle ? (
        <Text variant="p" size="base" color="muted">
          {subtitle}
        </Text>
      ) : null}
    </div>
  );
};

export default Header;


