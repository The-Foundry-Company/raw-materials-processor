import { prepare, layout } from '@chenglou/pretext';
import type { PreparedText } from '@chenglou/pretext';

// Font shorthands matching tailwind.config.ts
export const FONTS = {
  sans: 'Guton, system-ui, sans-serif',
  mono: '"IBM Plex Mono", monospace',
} as const;

export function fontShorthand(
  size: number,
  family: keyof typeof FONTS,
  weight: number = 400,
): string {
  return `${weight} ${size}px ${FONTS[family]}`;
}

// Line heights matching Tailwind defaults (in px)
export const LINE_HEIGHTS = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export function lineHeightPx(fontSize: number, ratio: keyof typeof LINE_HEIGHTS): number {
  return fontSize * LINE_HEIGHTS[ratio];
}

// Shrinkwrap: find tightest width that keeps the same line count (orphan/widow prevention)
export function findTightWidth(
  prepared: PreparedText,
  maxWidth: number,
  lh: number,
): number {
  const targetLines = layout(prepared, maxWidth, lh).lineCount;
  if (targetLines <= 1) return maxWidth;
  let lo = 1;
  let hi = Math.ceil(maxWidth);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (layout(prepared, mid, lh).lineCount <= targetLines) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export { prepare, layout };
export type { PreparedText };
