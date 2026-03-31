import { useEffect, useRef } from 'react';

/** Scrolls to the bottom of the ref element when `trigger` changes. Lenis intercepts for smooth scroll. */
export function useAutoScroll(trigger: unknown) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [trigger]);

  return ref;
}
