import React from 'react';
import { Card, Text, Badge } from '@shared/components';

interface ProfileOverviewCardProps {
  initials: string;
  displayName: string;
  email: string;
  role?: string;
}

const ProfileOverviewCard: React.FC<ProfileOverviewCardProps> = ({
  initials,
  displayName,
  email,
  role = 'Admin',
}) => {
  return (
    <Card className="device-spacing-component">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-brand-primary text-white flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0 mx-auto sm:mx-0">
          {initials}
        </div>
        <div className="w-full text-center sm:text-left">
          <Text variant="h3" className="device-text-heading" weight="semibold">
            {displayName}
          </Text>
          <Text variant="p" className="device-text-body text-neutral-600 mt-1">
            {email}
          </Text>
          <div className="mt-2 flex justify-center sm:justify-start">
            <Badge variant="info" size="sm" className="device-badge-sm">
              {role}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileOverviewCard;
