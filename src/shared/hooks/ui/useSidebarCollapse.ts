import { useState, useEffect } from 'react';

interface UseSidebarCollapseReturn {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
}

/**
 * Manages sidebar collapsed state with localStorage persistence
 * @param defaultCollapsed - Initial collapsed state (default: false)
 * @param storageKey - localStorage key for persistence (default: 'sidebar-collapsed')
 */
export function useSidebarCollapse(
  defaultCollapsed = false,
  storageKey = 'sidebar-collapsed'
): UseSidebarCollapseReturn {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return defaultCollapsed;

    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : defaultCollapsed;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed));
  }, [isCollapsed, storageKey]);

  const toggle = () => setIsCollapsed(prev => !prev);
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);

  return { isCollapsed, toggle, collapse, expand };
}

export default useSidebarCollapse;
