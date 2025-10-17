import React from 'react';

interface MobileLayoutProps {
  sidebar: React.ReactNode; // compact/fixed left rail
  children: React.ReactNode; // scrollable main content
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ sidebar, children }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Compact left rail (mobile) */}
      <div className="lg:hidden fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 z-50">
        {sidebar}
      </div>

      {/* Main content with left offset for rail */}
      <main className="flex-1 flex flex-col pl-16 lg:pl-0 h-full w-full">
        {/* Mobile content spacing and container sizing */}
        <div className="p-4 overflow-y-auto">
          <div className="w-full device-container">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MobileLayout;


