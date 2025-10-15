import { useEffect, useState } from 'react';

export function useResponsiveListItems(
  getContainerHeight: () => number | null,
  options?: { itemHeight?: number; min?: number; max?: number; observeEl?: () => Element | null }
) {
  const { itemHeight = 64, min = 1, max = 10, observeEl } = options || {};
  const [count, setCount] = useState<number>(min);

  useEffect(() => {
    const recalc = () => {
      const h = getContainerHeight();
      if (!h || h <= 0) {
        setCount(min);
        return;
      }
      const n = Math.floor(h / itemHeight);
      setCount(Math.max(min, Math.min(max, n)));
    };

    recalc();
    // Recalc on next ticks to capture layout settles
    const t1 = window.setTimeout(recalc, 50);
    const t2 = window.setTimeout(recalc, 150);
    window.addEventListener('resize', recalc);

    // Observe size changes of the container if available
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && observeEl) {
      const el = observeEl();
      if (el) {
        ro = new ResizeObserver(() => recalc());
        ro.observe(el as Element);
      }
    }

    return () => {
      window.removeEventListener('resize', recalc);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (ro) ro.disconnect();
    };
  }, [getContainerHeight, itemHeight, min, max]);

  return count;
}

export default useResponsiveListItems;


