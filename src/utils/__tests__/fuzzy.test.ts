import { describe, it, expect } from 'vitest';
import { levenshteinDistance, similarity, findBestMatch } from '../fuzzy';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('oak_log', 'oak_log')).toBe(0);
  });

  it('returns length of other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('returns 0 for two empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('computes single substitution', () => {
    expect(levenshteinDistance('cat', 'car')).toBe(1);
  });

  it('computes single insertion', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('computes single deletion', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('computes known reference pairs', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('sunday', 'saturday')).toBe(3);
  });

  it('handles Minecraft item names', () => {
    expect(levenshteinDistance('oak_planks', 'oak_plnks')).toBe(1);
    expect(levenshteinDistance('stone_bricks', 'stone_brick')).toBe(1);
    expect(levenshteinDistance('cobblestone', 'cobbleston')).toBe(1);
  });
});

describe('similarity', () => {
  it('returns 1 for identical strings', () => {
    expect(similarity('oak_log', 'oak_log')).toBe(1);
  });

  it('returns 0 for completely different same-length strings', () => {
    expect(similarity('abc', 'xyz')).toBeCloseTo(0, 1);
  });

  it('returns 1 for two empty strings', () => {
    expect(similarity('', '')).toBe(1);
  });

  it('computes correct ratio', () => {
    // "cat" vs "car" = distance 1, max length 3 → 1 - 1/3 = 0.667
    expect(similarity('cat', 'car')).toBeCloseTo(0.667, 2);
  });
});

describe('findBestMatch', () => {
  const candidates = [
    'oak_log', 'spruce_log', 'birch_log', 'stone', 'sand',
    'cobblestone', 'oak_planks', 'stone_bricks', 'glass',
    'polished_granite', 'smooth_sandstone', 'tuff',
  ];

  it('returns null for empty candidates', () => {
    expect(findBestMatch('oak_log', [])).toBeNull();
  });

  it('returns null for exact match (distance 0)', () => {
    // Exact matches should be handled before fuzzy — findBestMatch skips distance 0
    expect(findBestMatch('oak_log', candidates)).toBeNull();
  });

  it('matches single-character typo in medium name', () => {
    const result = findBestMatch('oak_plnks', candidates);
    expect(result).not.toBeNull();
    expect(result!.match).toBe('oak_planks');
  });

  it('matches single-character typo in short name', () => {
    const result = findBestMatch('tuf', candidates);
    expect(result).not.toBeNull();
    expect(result!.match).toBe('tuff');
  });

  it('rejects short names with distance > 1', () => {
    // "sand" vs "glass" = distance 4, too far
    expect(findBestMatch('glss', candidates)).not.toBeNull(); // distance 1 from "glass"
    expect(findBestMatch('gl', candidates)).toBeNull(); // too short, too different
  });

  it('matches single-char typo in short name to correct item', () => {
    // "samd" vs "sand" = distance 1, should match sand (not stone)
    const result = findBestMatch('samd', candidates);
    expect(result).not.toBeNull();
    expect(result!.match).toBe('sand');
  });

  it('rejects transpositions in short names (distance 2)', () => {
    // "snad" vs "sand" = distance 2, exceeds short-name threshold of 1
    expect(findBestMatch('snad', candidates)).toBeNull();
  });

  it('matches longer names with small edits', () => {
    const result = findBestMatch('cobbleston', candidates);
    expect(result).not.toBeNull();
    expect(result!.match).toBe('cobblestone');
  });

  it('matches long names within similarity threshold', () => {
    const result = findBestMatch('polished_granit', candidates);
    expect(result).not.toBeNull();
    expect(result!.match).toBe('polished_granite');
  });

  it('rejects completely different names', () => {
    expect(findBestMatch('diamond_ore', candidates)).toBeNull();
  });

  it('returns best match among multiple close candidates', () => {
    const result = findBestMatch('spruce_lo', candidates);
    expect(result).not.toBeNull();
    expect(result!.match).toBe('spruce_log');
  });
});
