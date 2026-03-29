import { useRef, useState, useEffect, useCallback } from 'react';

export function useContainerWidth(): [React.RefCallback<HTMLElement>, number | null] {
  const [width, setWidth] = useState<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const refCallback = useCallback((node: HTMLElement | null) => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    elementRef.current = node;

    if (!node) {
      setWidth(null);
      return;
    }

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

    observerRef.current.observe(node);
  }, []);

  return [refCallback, width];
}
