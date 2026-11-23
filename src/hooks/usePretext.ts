import { useState, useEffect, useCallback, useRef } from 'react';
import { FONTS, prepare, layout, fontShorthand, findTightWidth, lineHeightPx } from '../lib/pretext';
import type { PreparedText } from '../lib/pretext';

export function usePretext() {
  const [isReady, setIsReady] = useState(false);
  const cacheRef = useRef<Map<string, PreparedText>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function waitForFonts() {
      await document.fonts.ready;
      // Check that our required fonts are available
      const allLoaded = Object.values(FONTS).every((f) =>
        document.fonts.check(`16px ${f}`),
      );
      if (!cancelled) {
        setIsReady(allLoaded);
      }
    }

    waitForFonts();
    return () => { cancelled = true; };
  }, []);

  const getPrepared = useCallback(
    (text: string, font: string): PreparedText | null => {
      if (!isReady) return null;
      const key = `${font}::${text}`;
      let cached = cacheRef.current.get(key);
      if (!cached) {
        cached = prepare(text, font);
        cacheRef.current.set(key, cached);
      }
      return cached;
    },
    [isReady],
  );

  const measureHeight = useCallback(
    (text: string, font: string, maxWidth: number, lh: number): number | null => {
      const prepared = getPrepared(text, font);
      if (!prepared) return null;
      return layout(prepared, maxWidth, lh).height;
    },
    [getPrepared],
  );

  const shrinkwrap = useCallback(
    (text: string, font: string, maxWidth: number, lh: number): number | null => {
      const prepared = getPrepared(text, font);
      if (!prepared) return null;
      return findTightWidth(prepared, maxWidth, lh);
    },
    [getPrepared],
  );

  return { isReady, getPrepared, measureHeight, shrinkwrap, layout, fontShorthand, lineHeightPx };
}
