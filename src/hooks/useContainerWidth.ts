import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Observes the **parent** element's width to avoid ResizeObserver loops
 * when the measured element's own width is modified (e.g., via max-width).
 */
export function useContainerWidth(): [React.RefCallback<HTMLElement>, number | null] {
  const [width, setWidth] = useState<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const refCallback = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node) {
      setWidth(null);
      return;
    }

    // Observe the parent element, not the element itself.
    // This prevents loops when we set max-width on the element.
    const target = node.parentElement ?? node;

    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const boxSize = entry.contentBoxSize?.[0];
        if (boxSize) {
          setWidth(boxSize.inlineSize);
        } else {
          setWidth(entry.contentRect.width);
        }
      }
    });

    observerRef.current.observe(target);
  }, []);

  return [refCallback, width];
}
