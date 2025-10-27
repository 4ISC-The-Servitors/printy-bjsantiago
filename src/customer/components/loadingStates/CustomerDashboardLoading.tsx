import React from 'react';
import { Skeleton, Card } from '@shared/components';

/**
 * CustomerDashboardLoading Component
 * 
 * Loading skeleton that accurately mimics the Customer Dashboard layout:
 * - Header section with title and subtitle
 * - Recent Card with toggle tabs and order details
 * - Chat Cards grid (6 action cards)
 * 
 * Uses the same responsive classes and spacing as the actual dashboard components
 * for a seamless loading experience.
 */
const CustomerDashboardLoading: React.FC = () => {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6 sm:mb-8">
        <Skeleton 
          variant="text" 
          width="300px" 
          height="36px" 
          className="mx-auto device-text-heading"
        />
        <Skeleton 
          variant="text" 
          width="250px" 
          height="20px" 
          className="mx-auto device-text-body"
        />
      </div>

      {/* Dashboard Grid Container */}
      <div className="w-full">
        <div className="space-y-6 sm:space-y-8">
          {/* Recent Card Section */}
          <div className="device-card-container">
            <Card className="relative overflow-hidden bg-white border border-neutral-200 device-card-container">
              {/* Toggle Buttons */}
              <div className="flex items-center justify-between mb-4 p-2 bg-neutral-50 border-b border-neutral-200">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      width="80px"
                      height="32px"
                      className="rounded-md"
                    />
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-3 sm:p-4">
                <div className="device-spacing-component">
                  {/* Header with title and View all button */}
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton
                      variant="text"
                      width="120px"
                      height="24px"
                      className="device-text-heading"
                    />
                    <Skeleton
                      variant="rectangular"
                      width="70px"
                      height="32px"
                      className="rounded"
                    />
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3">
                    {/* Row 1: Display ID and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton variant="text" width="120px" height="20px" />
                        <span className="text-neutral-400">•</span>
                        <Skeleton variant="text" width="80px" height="16px" />
                      </div>
                      <Skeleton
                        variant="rectangular"
                        width="90px"
                        height="24px"
                        className="rounded-full"
                      />
                    </div>

                    {/* Row 2: Amount */}
                    <div className="flex justify-end">
                      <Skeleton variant="text" width="100px" height="28px" />
                    </div>

                    {/* Row 3: Dates */}
                    <div className="mt-1 space-y-1">
                      <Skeleton variant="text" width="200px" height="16px" />
                      <Skeleton variant="text" width="180px" height="16px" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Cards Grid Section - matches actual ChatCards order */}
          <div className="device-card-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-4 lg:gap-5">
              {/* Services Offered */}
              <Card className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  className="rounded-lg mb-4"
                />
                <Skeleton
                  variant="text"
                  width="75%"
                  height="20px"
                  className="mb-2 device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="95%"
                  height="14px"
                  className="mb-1"
                />
                <Skeleton
                  variant="text"
                  width="65%"
                  height="14px"
                />
              </Card>

              {/* Ask Quote */}
              <Card className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  className="rounded-lg mb-4"
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height="20px"
                  className="mb-2 device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="100%"
                  height="14px"
                  className="mb-1"
                />
                <Skeleton
                  variant="text"
                  width="70%"
                  height="14px"
                />
              </Card>

              {/* Place Order */}
              <Card className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  className="rounded-lg mb-4"
                />
                <Skeleton
                  variant="text"
                  width="65%"
                  height="20px"
                  className="mb-2 device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="85%"
                  height="14px"
                  className="mb-1"
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height="14px"
                />
              </Card>

              {/* Ask Assistance */}
              <Card className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  className="rounded-lg mb-4"
                />
                <Skeleton
                  variant="text"
                  width="70%"
                  height="20px"
                  className="mb-2 device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="100%"
                  height="14px"
                  className="mb-1"
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height="14px"
                />
              </Card>

              {/* About Us */}
              <Card className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  className="rounded-lg mb-4"
                />
                <Skeleton
                  variant="text"
                  width="50%"
                  height="20px"
                  className="mb-2 device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="90%"
                  height="14px"
                  className="mb-1"
                />
                <Skeleton
                  variant="text"
                  width="55%"
                  height="14px"
                />
              </Card>

              {/* FAQs */}
              <Card className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  className="rounded-lg mb-4"
                />
                <Skeleton
                  variant="text"
                  width="40%"
                  height="20px"
                  className="mb-2 device-text-heading"
                />
                <Skeleton
                  variant="text"
                  width="95%"
                  height="14px"
                  className="mb-1"
                />
                <Skeleton
                  variant="text"
                  width="70%"
                  height="14px"
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardLoading;

