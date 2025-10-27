import React from 'react';
import { Skeleton, Card } from '@shared/components';

/**
 * CustomerAccountSettingsLoading Component
 *
 * Enhanced loading skeleton that accurately mimics the Account Settings layout:
 * - Full-screen gradient background matching the actual page
 * - Mobile header with burger menu (hidden on desktop)
 * - Back button and page header with proper device-text classes
 * - Profile Overview Card with avatar, name, email, and membership badge using responsive design
 * - Personal Information Form with all field groups properly structured
 * - Security Settings section with password change
 * - Notification Preferences section with toggle switches
 * - Proper responsive spacing and device-* classes for consistency
 * - Container layout that matches the actual page structure
 */
const CustomerAccountSettingsLoading: React.FC = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex flex-col">
      {/* Mobile header with burger menu - matches actual page structure */}
      <div className="lg:hidden flex flex-col">
        <header className="bg-white/80 backdrop-blur border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
          <Skeleton variant="rectangular" width="32px" height="32px" className="rounded" />
          <div className="w-10" /> {/* Spacer to match actual layout */}
        </header>
      </div>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="device-container py-6 md:py-10">
          {/* Back button and page header - matches actual component */}
          <div className="mb-6 flex items-center gap-3">
            <Skeleton
              variant="rectangular"
              width="80px"
              height="36px"
              className="rounded h-9 w-9 md:h-auto md:w-auto md:px-4 md:py-2 p-0"
            />
            <Skeleton
              variant="text"
              width="200px"
              height="32px"
              className="device-text-heading text-neutral-900"
            />
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Profile Overview Card - enhanced with device classes */}
            <Card className="device-spacing-component">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <Skeleton variant="circular" width="80px" height="80px" />
                <div className="w-full space-y-2 text-center md:text-left">
                  <Skeleton
                    variant="text"
                    width="250px"
                    height="24px"
                    className="mx-auto md:mx-0 device-text-heading"
                  />
                  <Skeleton
                    variant="text"
                    width="200px"
                    height="20px"
                    className="mx-auto md:mx-0 device-text-body"
                  />
                  <div className="flex justify-center md:justify-start">
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

            {/* Personal Information Form - enhanced with realistic field structure */}
            <Card className="device-spacing-component relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
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
                {/* Basic contact fields */}
                <div className="space-y-2">
                  <Skeleton variant="text" width="120px" height="16px" className="device-text-caption" />
                  <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="text" width="120px" height="16px" className="device-text-caption" />
                  <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                </div>

                {/* Address fields in grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100px" height="16px" className="device-text-caption" />
                    <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100px" height="16px" className="device-text-caption" />
                    <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100px" height="16px" className="device-text-caption" />
                    <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100px" height="16px" className="device-text-caption" />
                    <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Skeleton variant="text" width="120px" height="16px" className="device-text-caption" />
                    <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100px" height="16px" className="device-text-caption" />
                    <Skeleton variant="rectangular" width="100%" height="40px" className="rounded device-input" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Settings - enhanced with realistic content */}
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
                    <Skeleton variant="text" width="120px" height="16px" className="device-text-body" />
                    <Skeleton variant="text" width="180px" height="14px" className="device-text-caption" />
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

            {/* Notification Preferences - enhanced with multiple toggles */}
            <Card className="device-spacing-component">
              <div className="mb-4 space-y-2">
                <Skeleton
                  variant="text"
                  width="240px"
                  height="24px"
                  className="device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="350px"
                  height="16px"
                  className="device-text-body"
                />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', desc: 'Receive updates via email' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <Skeleton variant="text" width={item.label.length * 10} height="16px" className="device-text-body" />
                      <Skeleton variant="text" width={180 + index * 15} height="14px" className="device-text-caption" />
                    </div>
                    <Skeleton
                      variant="rectangular"
                      width="48px"
                      height="28px"
                      className="rounded-full"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerAccountSettingsLoading;
