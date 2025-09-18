import React from 'react';
import { Skeleton } from './index';
import { Card, Container } from './index';

interface PageLoadingProps {
  variant?: 'dashboard' | 'list' | 'form' | 'grid' | 'minimal';
  className?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({
  variant = 'dashboard',
  className = '',
}) => {
  const renderDashboardLoading = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="200px" height="32px" />
        <Skeleton variant="text" width="400px" height="20px" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-2">
              <Skeleton variant="text" width="120px" height="16px" />
              <Skeleton variant="text" width="60px" height="24px" />
              <Skeleton variant="text" width="80px" height="14px" />
            </div>
          </Card>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton variant="text" width="150px" height="20px" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" height="16px" />
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton variant="text" width="150px" height="20px" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" height="16px" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderListLoading = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="200px" height="32px" />
        <Skeleton variant="rectangular" width="120px" height="40px" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton variant="rectangular" width="150px" height="40px" />
        <Skeleton variant="rectangular" width="150px" height="40px" />
        <Skeleton variant="rectangular" width="100px" height="40px" />
      </div>

      {/* List Items */}
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="space-y-2">
                  <Skeleton variant="text" width="200px" height="16px" />
                  <Skeleton variant="text" width="150px" height="14px" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton variant="rectangular" width="80px" height="24px" />
                <Skeleton variant="rectangular" width="60px" height="32px" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFormLoading = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="250px" height="32px" />
        <Skeleton variant="text" width="400px" height="20px" />
      </div>

      {/* Form Fields */}
      <Card className="p-6">
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" width="120px" height="16px" />
              <Skeleton variant="rectangular" width="100%" height="40px" />
            </div>
          ))}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Skeleton variant="rectangular" width="80px" height="40px" />
            <Skeleton variant="rectangular" width="100px" height="40px" />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderGridLoading = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="200px" height="32px" />
        <Skeleton variant="rectangular" width="120px" height="40px" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton variant="rectangular" width="100%" height="120px" />
              <div className="space-y-2">
                <Skeleton variant="text" width="80%" height="16px" />
                <Skeleton variant="text" width="60%" height="14px" />
                <Skeleton variant="text" width="40%" height="14px" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton variant="rectangular" width="60px" height="20px" />
                <Skeleton variant="rectangular" width="80px" height="32px" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMinimalLoading = () => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="space-y-4 text-center">
        <Skeleton
          variant="circular"
          width={48}
          height={48}
          className="mx-auto"
        />
        <div className="space-y-2">
          <Skeleton
            variant="text"
            width="200px"
            height="20px"
            className="mx-auto"
          />
          <Skeleton
            variant="text"
            width="150px"
            height="16px"
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );

  const renderLoading = () => {
    switch (variant) {
      case 'dashboard':
        return renderDashboardLoading();
      case 'list':
        return renderListLoading();
      case 'form':
        return renderFormLoading();
      case 'grid':
        return renderGridLoading();
      case 'minimal':
        return renderMinimalLoading();
      default:
        return renderDashboardLoading();
    }
  };

  return (
    <Container className={`py-6 ${className}`}>{renderLoading()}</Container>
  );
};

export default PageLoading;
