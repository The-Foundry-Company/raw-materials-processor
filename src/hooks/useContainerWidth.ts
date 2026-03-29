import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Measures container width synchronously on mount and window resize.
 * Follows the Pretext demo pattern: no ResizeObserver, just direct DOM reads
 * with a single-RAF gate to coalesce resize events.
 *
 * When the element has a max-width applied (e.g., from shrinkwrap), we
 * temporarily clear it before reading to get the unconstrained available width.
 */
export function useContainerWidth(): [React.RefCallback<HTMLElement>, number | null] {
  const [width, setWidth] = useState<number | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;

    // Temporarily clear max-width to measure unconstrained available width.
    // Reading clientWidth forces a sync reflow, but the browser won't paint
    // until JS yields — so there's no visible flash.
    const saved = el.style.maxWidth;
    el.style.maxWidth = 'none';
    const w = el.clientWidth;
    el.style.maxWidth = saved;

    setWidth((prev) => (prev === w ? prev : w));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (rafRef.current != null) return; // coalesce: one RAF per cycle
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      if (node) {
        // Initial measurement — no max-width applied yet at this point
        setWidth(node.clientWidth);
      } else {
        setWidth(null);
      }
    },
    [],
  );

  return [refCallback, width];
}
