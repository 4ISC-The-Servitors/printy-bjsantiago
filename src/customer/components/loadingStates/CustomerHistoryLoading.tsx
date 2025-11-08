import React from 'react';
import { Skeleton, Card } from '@shared/components';

interface CustomerHistoryLoadingProps {
  title?: string;
}

/**
 * CustomerHistoryLoading Component
 *
 * Loading skeleton for history pages (Chat, Order, Quote, Ticket):
 * - Page header with title
 * - Search bar
 * - Filter buttons
 * - List of history items with cards
 * - Pagination controls
 *
 * Uses the same responsive classes and spacing as the actual history pages
 * for a seamless loading experience.
 */
const CustomerHistoryLoading: React.FC<CustomerHistoryLoadingProps> = () => {
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="200px" height="32px" />
        <Skeleton variant="text" width="300px" height="16px" />
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton
          variant="rectangular"
          width="100%"
          height="40px"
          className="rounded"
        />
        <Skeleton
          variant="rectangular"
          width="100px"
          height="40px"
          className="rounded"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="80px"
            height="32px"
            className="rounded-full"
          />
        ))}
      </div>

      {/* History Items List - matches HistoryItemCard structure */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card
            key={i}
            className="group device-spacing-component rounded-lg border bg-white/60 hover:bg-white transition-colors p-3 sm:p-4"
          >
            <div className="flex flex-col gap-3">
              {/* Row 1: Display ID • Title | Status Badge */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Skeleton
                      variant="text"
                      width={`${100 + i * 10}px`}
                      height="20px"
                      className="device-text-fraunces shrink-0"
                    />
                    <span className="text-neutral-400">•</span>
                    <Skeleton
                      variant="text"
                      width={`${150 + i * 20}px`}
                      height="16px"
                      className="min-w-0"
                    />
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  <Skeleton
                    variant="rectangular"
                    width={`${80 + i * 10}px`}
                    height="24px"
                    className="rounded-full"
                  />
                </div>
              </div>

              {/* Row 2: Amount (for orders) */}
              {i % 2 === 0 && (
                <div className="flex justify-end">
                  <Skeleton
                    variant="text"
                    width={`${80 + i * 15}px`}
                    height="22px"
                  />
                </div>
              )}

              {/* Row 3: Metadata section */}
              <div className="space-y-1">
                <Skeleton
                  variant="text"
                  width={`${180 + i * 25}px`}
                  height="14px"
                />
                <Skeleton
                  variant="text"
                  width={`${160 + i * 20}px`}
                  height="14px"
                />
              </div>

              {/* Row 4: Action buttons */}
              <div className="flex items-center justify-between pt-1">
                <Skeleton
                  variant="text"
                  width={`${90 + i * 10}px`}
                  height="13px"
                />
                <div className="flex gap-2">
                  <Skeleton
                    variant="rectangular"
                    width={`${60 + i * 8}px`}
                    height="32px"
                    className="rounded"
                  />
                  <Skeleton
                    variant="rectangular"
                    width={`${70 + i * 10}px`}
                    height="32px"
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="40px"
              height="40px"
              className="rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryLoading;
