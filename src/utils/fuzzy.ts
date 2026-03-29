/**
 * Levenshtein distance between two strings (1D DP optimization).
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/**
 * String similarity score between 0 and 1 (1 = identical).
 */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Find the best fuzzy match for `needle` among `candidates`.
 * Uses tiered thresholds to prevent false positives on short names.
 * Returns null if no acceptable match is found.
 */
export function findBestMatch(
  needle: string,
  candidates: string[],
): { match: string; score: number } | null {
  if (candidates.length === 0) return null;

  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const dist = levenshteinDistance(needle, candidate);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = candidate;
    }
  }

  if (bestMatch === null || bestDistance === 0) return null;

  // Tiered threshold based on needle length
  const len = needle.length;
  let acceptable: boolean;

  if (len <= 6) {
    acceptable = bestDistance <= 1;
  } else if (len <= 15) {
    acceptable = bestDistance <= 2;
  } else {
    acceptable = similarity(needle, bestMatch) >= 0.85;
  }

  if (!acceptable) return null;

  return { match: bestMatch, score: similarity(needle, bestMatch) };
}
