import React from 'react';

interface DesktopLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode; // main content area
  rightPanel?: React.ReactNode; // optional right dock/panel
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ sidebar, children, rightPanel }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Left Sidebar (desktop) */}
      <aside className="hidden lg:flex w-80 bg-white border-r border-neutral-200 flex-col">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${rightPanel ? 'lg:mr-[420px]' : ''}`}>
        {/* Desktop content spacing and container sizing */}
        <div className="p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full device-container">
            {children}
          </div>
        </div>
      </main>

      {/* Optional Right Panel (e.g., chat dock) */}
      {rightPanel ? (
        <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-neutral-200 flex-col z-30">
          {rightPanel}
        </aside>
      ) : null}
    </div>
  );
};

export default DesktopLayout;


