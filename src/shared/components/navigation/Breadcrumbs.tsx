import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component for navigation
 *
 * Features:
 * - Clickable navigation items
 * - Active state styling
 * - Home icon support
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Dashboard', path: '/customer' },
 *     { label: 'Order History', isActive: true }
 *   ]}
 * />
 * ```
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.path && !item.isActive) {
      navigate(item.path);
    }
  };

  if (items.length === 0) return null;

  return (
    <nav
      className={`flex items-center space-x-1 device-text-caption ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = item.path && !item.isActive;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center">
              {index === 0 && item.label.toLowerCase() === 'dashboard' && (
                <Home className="w-4 h-4 text-neutral-500 mr-1" />
              )}
              <button
                onClick={() => handleItemClick(item)}
                disabled={!isClickable}
                className={`
                  font-medium transition-colors duration-200
                  ${
                    item.isActive
                      ? 'text-neutral-900 cursor-default'
                      : 'text-neutral-500 hover:text-neutral-700 cursor-pointer'
                  }
                  ${isClickable ? 'hover:underline' : ''}
                `}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </button>
            </div>
            {!isLast && <ChevronRight className="w-4 h-4 text-neutral-400" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
