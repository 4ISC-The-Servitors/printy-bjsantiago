import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';

const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 420;
const MAX_WIDTH = 760;
const STORAGE_KEY = 'adminChatDockWidth';
const KEYBOARD_STEP = 10;

const clampWidth = (value: number) =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)));

export function useAdminChatDockWidth() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(DEFAULT_WIDTH);
  const latestWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    latestWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = clampWidth(parseInt(stored, 10));
        setWidth(parsed);
        dragStartWidthRef.current = parsed;
      }
    } catch {
      // Storage can fail in private mode; ignore and use defaults
    }
  }, []);

  const persistWidth = useCallback((value: number) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, value.toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handlePointerMove = useCallback((clientX: number) => {
    const delta = dragStartXRef.current - clientX;
    const nextWidth = clampWidth(dragStartWidthRef.current + delta);
    setWidth(nextWidth);
  }, []);

  const mouseMoveListener = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      handlePointerMove(event.clientX);
    },
    [handlePointerMove],
  );

  const touchMoveListener = useCallback(
    (event: TouchEvent) => {
      if (event.touches[0]) {
        event.preventDefault();
        handlePointerMove(event.touches[0].clientX);
      }
    },
    [handlePointerMove],
  );

  const stopResizing = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsResizing(false);
    persistWidth(latestWidthRef.current);

    window.removeEventListener('mousemove', mouseMoveListener);
    window.removeEventListener('mouseup', stopResizing);
    window.removeEventListener('touchmove', touchMoveListener);
    window.removeEventListener('touchend', stopResizing);
  }, [mouseMoveListener, persistWidth, touchMoveListener]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!isResizing) return undefined;
    const cleanup = () => {
      window.removeEventListener('mousemove', mouseMoveListener);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', touchMoveListener);
      window.removeEventListener('touchend', stopResizing);
    };
    return cleanup;
  }, [isResizing, mouseMoveListener, stopResizing, touchMoveListener]);

  const beginDrag = useCallback(
    (clientX: number) => {
      if (typeof window === 'undefined') return;
      dragStartXRef.current = clientX;
      dragStartWidthRef.current = latestWidthRef.current;
      setIsResizing(true);

      window.addEventListener('mousemove', mouseMoveListener);
      window.addEventListener('mouseup', stopResizing);
      window.addEventListener('touchmove', touchMoveListener, {
        passive: false,
      });
      window.addEventListener('touchend', stopResizing);
    },
    [mouseMoveListener, stopResizing, touchMoveListener],
  );

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      beginDrag(event.clientX);
    },
    [beginDrag],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLButtonElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      beginDrag(touch.clientX);
    },
    [beginDrag],
  );

  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    dragStartWidthRef.current = DEFAULT_WIDTH;
    persistWidth(DEFAULT_WIDTH);
  }, [persistWidth]);

  const handleKeyboardResize = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const delta = event.key === 'ArrowLeft' ? KEYBOARD_STEP : -KEYBOARD_STEP;
        const next = clampWidth(latestWidthRef.current + delta);
        setWidth(next);
        persistWidth(next);
      } else if (event.key === 'Home') {
        event.preventDefault();
        resetWidth();
      }
    },
    [persistWidth, resetWidth],
  );

  return {
    width,
    isResizing,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    handleMouseDown,
    handleTouchStart,
    handleKeyboardResize,
    resetWidth,
  };
}

