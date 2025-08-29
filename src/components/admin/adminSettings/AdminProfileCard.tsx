import React from 'react';
import { Card, Text, Badge } from '../../shared';
import { Shield, Users, Clock } from 'lucide-react';
import type { AdminData } from '../../../pages/admin/adminSettings/AdminSettingsPage';

interface AdminProfileCardProps {
  initials: string;
  data: AdminData;
}

const AdminProfileCard: React.FC<AdminProfileCardProps> = ({
  initials,
  data,
}) => {
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getRoleBadgeVariant = (role: AdminData['role']) => {
    return role === 'super_admin' ? 'error' : 'warning';
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-brand-primary text-white flex items-center justify-center text-2xl md:text-3xl font-bold flex-shrink-0">
          {initials}
        </div>
        
        <div className="w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <div>
              <Text
                variant="h3"
                size="xl"
                weight="semibold"
              >
                {data.displayName}
              </Text>
              <Text
                variant="p"
                className="text-neutral-600 mt-1"
              >
                {data.email}
              </Text>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-end">
              <Badge
                variant={getRoleBadgeVariant(data.role)}
                size="sm"
                className="flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                {data.role.replace('_', ' ').toUpperCase()}
              </Badge>
              
              <Badge
                variant="info"
                size="sm"
                className="flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                {data.department}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <div className="flex items-center gap-2 text-neutral-600">
              <Clock className="h-4 w-4" />
              <span>Last login: {formatLastLogin(data.lastLogin)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-neutral-600">
              <Shield className="h-4 w-4" />
              <span>{data.permissions.length} permissions</span>
            </div>
          </div>

          {data.permissions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 justify-center md:justify-start">
              {data.permissions.map((permission, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  size="xs"
                  className="text-xs"
                >
                  {permission.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AdminProfileCard;
