import React from 'react';
import { Card, Text, Badge } from '../../shared';

interface ProfileOverviewCardProps {
  initials: string;
  displayName: string;
  email: string;
  membership?: 'Valued' | 'Regular';
}

const ProfileOverviewCard: React.FC<ProfileOverviewCardProps> = ({
  initials,
  displayName,
  email,
  membership = 'Regular',
}) => {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-brand-primary text-white flex items-center justify-center text-2xl md:text-3xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="w-full">
          <Text
            variant="h3"
            size="xl"
            weight="semibold"
            className="text-center md:text-left"
          >
            {displayName}
          </Text>
          <Text
            variant="p"
            className="text-neutral-600 mt-1 text-center md:text-left"
          >
            {email}
          </Text>
          <div className="mt-2 flex justify-center md:justify-start">
            <Badge
              variant={membership === 'Valued' ? 'warning' : 'info'}
              size="sm"
            >
              {membership} Member
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileOverviewCard;
