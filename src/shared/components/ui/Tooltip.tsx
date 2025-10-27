import React from 'react';

export interface TooltipProps {
  label: string;
  position?: 'right' | 'left' | 'top' | 'bottom';
  children: React.ReactNode;
}

const positionClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  top: 'left-1/2 -translate-x-1/2 bottom-full mb-2',
  bottom: 'left-1/2 -translate-x-1/2 top-full mt-2',
};

const Tooltip: React.FC<TooltipProps> = ({
  label,
  position = 'right',
  children,
}) => {
  return (
    <div className="tooltip-wrapper group inline-flex" style={{ zIndex: 99999 }}>
      {children}
      <div
        role="tooltip"
        className={`tooltip-content pointer-events-none absolute whitespace-nowrap rounded-md bg-neutral-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg ${positionClasses[position]}`}
        style={{ zIndex: 99999 }}
      >
        {label}
      </div>
    </div>
  );
};

export default Tooltip;
