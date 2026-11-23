import { useState, useEffect, useCallback, useRef } from 'react';
import { prepare, layout, fontShorthand, findTightWidth, lineHeightPx } from '../lib/pretext';
import type { PreparedText } from '../lib/pretext';

export function usePretext(font: string) {
  const [loadedFont, setLoadedFont] = useState<string>();
  const isReady = loadedFont === font;
  const cacheRef = useRef<Map<string, PreparedText>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadFont() {
      try {
        const faces = await document.fonts.load(font);
        if (!cancelled && faces.length) setLoadedFont(font);
      } catch {
        // Let the browser wrap the fallback text if the CDN face is unavailable.
      }
    }

    loadFont();
    return () => { cancelled = true; };
  }, [font]);

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
