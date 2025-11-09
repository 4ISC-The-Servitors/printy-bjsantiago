import React from 'react';
import { Skeleton, Card } from '@shared/components';

const AdminAccountSettingsLoading: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Overview Card */}
      <Card className="device-spacing-component">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <Skeleton
            variant="circular"
            width="80px"
            height="80px"
            className="mx-auto sm:mx-0"
          />
          <div className="w-full space-y-2 text-center sm:text-left">
            <Skeleton
              variant="text"
              width="250px"
              height="24px"
              className="mx-auto sm:mx-0 device-text-heading"
            />
            <Skeleton
              variant="text"
              width="200px"
              height="20px"
              className="mx-auto sm:mx-0 device-text-body"
            />
            <div className="flex justify-center sm:justify-start">
              <Skeleton
                variant="rectangular"
                width="100px"
                height="24px"
                className="rounded-full device-badge-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information Form */}
      <Card className="device-spacing-component relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="space-y-1">
            <Skeleton
              variant="text"
              width="200px"
              height="24px"
              className="device-text-heading"
            />
            <Skeleton
              variant="text"
              width="300px"
              height="16px"
              className="device-text-body"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton
              variant="text"
              width="120px"
              height="16px"
              className="device-text-caption"
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height="40px"
              className="rounded device-input"
            />
          </div>
          <div className="space-y-2">
            <Skeleton
              variant="text"
              width="120px"
              height="16px"
              className="device-text-caption"
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height="40px"
              className="rounded device-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton
                  variant="text"
                  width="100px"
                  height="16px"
                  className="device-text-caption"
                />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="40px"
                  className="rounded device-input"
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="device-spacing-component">
        <div className="mb-4">
          <Skeleton
            variant="text"
            width="180px"
            height="24px"
            className="device-text-heading"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="space-y-1">
              <Skeleton
                variant="text"
                width="120px"
                height="16px"
                className="device-text-body"
              />
            </div>
            <Skeleton
              variant="rectangular"
              width="120px"
              height="36px"
              className="rounded device-btn-secondary"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAccountSettingsLoading;
