import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  generateEstimate,
  calculateTotalDiamonds,
  countMatched,
  calculateProjectEstimate,
  LABOR_RATE,
  ADMIN_FEE_RATE,
} from '../pricing';
import type { ProcessedItem, PricingEntry } from '../../processor/types';

describe('parseCSV', () => {
  it('parses standard CSV with header', () => {
    const csv = 'Item ID,Value in D/item\noak_log,50\nstone,10';
    const result = parseCSV(csv);
    expect(result).toEqual([
      { itemId: 'oak_log', diamondValue: 50 },
      { itemId: 'stone', diamondValue: 10 },
    ]);
  });

  it('strips minecraft: prefix from item IDs', () => {
    const csv = 'Item ID,Value\nminecraft:sandstone,100\nsandstone,100';
    const result = parseCSV(csv);
    expect(result[0].itemId).toBe('sandstone');
    expect(result[1].itemId).toBe('sandstone');
  });

  it('handles empty lines and malformed entries', () => {
    const csv = 'header\n\noak_log,50\nbadline\n,30\nstone,abc';
    const result = parseCSV(csv);
    expect(result).toEqual([{ itemId: 'oak_log', diamondValue: 50 }]);
  });

  it('returns empty array for header-only CSV', () => {
    expect(parseCSV('header')).toEqual([]);
    expect(parseCSV('')).toEqual([]);
  });

  it('lowercases item IDs', () => {
    const csv = 'h\nOAK_LOG,50\nMinecraft:Stone,10';
    const result = parseCSV(csv);
    expect(result[0].itemId).toBe('oak_log');
    expect(result[1].itemId).toBe('stone');
  });
});

describe('generateEstimate', () => {
  const pricing: PricingEntry[] = [
    { itemId: 'oak_log', diamondValue: 50 },
    { itemId: 'stone', diamondValue: 10 },
    { itemId: 'cobblestone', diamondValue: 5 },
  ];

  const items: ProcessedItem[] = [
    { Item: 'minecraft:oak_log', Quantity: 100, Category: 'Wood' },
    { Item: 'minecraft:stone', Quantity: 200, Category: 'Stone' },
    { Item: 'minecraft:diamond_ore', Quantity: 10, Category: 'Other' },
  ];

  it('exact matches return matchType "exact"', () => {
    const result = generateEstimate(items, pricing);
    expect(result[0].matchType).toBe('exact');
    expect(result[0].matched).toBe(true);
    expect(result[0].diamondValue).toBe(50);
    expect(result[0].totalDiamonds).toBe(5000);
  });

  it('missing items return matchType "missing" with 0 diamonds', () => {
    const result = generateEstimate(items, pricing);
    const missing = result.find(i => i.Item === 'minecraft:diamond_ore')!;
    expect(missing.matchType).toBe('missing');
    expect(missing.matched).toBe(false);
    expect(missing.diamondValue).toBe(0);
    expect(missing.totalDiamonds).toBe(0);
  });

  it('fuzzy matches typos with matchType "fuzzy"', () => {
    const typoItems: ProcessedItem[] = [
      { Item: 'minecraft:cobbleston', Quantity: 50, Category: 'Stone' },
    ];
    const result = generateEstimate(typoItems, pricing);
    expect(result[0].matchType).toBe('fuzzy');
    expect(result[0].matched).toBe(true);
    expect(result[0].fuzzyMatchedTo).toBe('cobblestone');
    expect(result[0].diamondValue).toBe(5);
    expect(result[0].totalDiamonds).toBe(250);
  });
});

describe('calculateTotalDiamonds', () => {
  it('sums totalDiamonds across items', () => {
    const items = [
      { Item: 'a', Quantity: 10, Category: 'X', diamondValue: 5, totalDiamonds: 50, matched: true, matchType: 'exact' as const },
      { Item: 'b', Quantity: 20, Category: 'X', diamondValue: 3, totalDiamonds: 60, matched: true, matchType: 'exact' as const },
      { Item: 'c', Quantity: 5, Category: 'X', diamondValue: 0, totalDiamonds: 0, matched: false, matchType: 'missing' as const },
    ];
    expect(calculateTotalDiamonds(items)).toBe(110);
  });
});

describe('countMatched', () => {
  it('counts exact, fuzzy, and unmatched separately', () => {
    const items = [
      { Item: 'a', Quantity: 1, Category: 'X', diamondValue: 5, totalDiamonds: 5, matched: true, matchType: 'exact' as const },
      { Item: 'b', Quantity: 1, Category: 'X', diamondValue: 3, totalDiamonds: 3, matched: true, matchType: 'fuzzy' as const, fuzzyMatchedTo: 'bb' },
      { Item: 'c', Quantity: 1, Category: 'X', diamondValue: 0, totalDiamonds: 0, matched: false, matchType: 'missing' as const },
      { Item: 'd', Quantity: 1, Category: 'X', diamondValue: 10, totalDiamonds: 10, matched: true, matchType: 'exact' as const },
    ];
    const result = countMatched(items);
    expect(result.matched).toBe(2);
    expect(result.fuzzy).toBe(1);
    expect(result.unmatched).toBe(1);
  });
});

describe('calculateProjectEstimate', () => {
  const items = [
    { Item: 'a', Quantity: 100, Category: 'Wood', diamondValue: 50, totalDiamonds: 5000, matched: true, matchType: 'exact' as const },
    { Item: 'b', Quantity: 200, Category: 'Stone', diamondValue: 10, totalDiamonds: 2000, matched: true, matchType: 'exact' as const },
    { Item: 'c', Quantity: 50, Category: 'Other', diamondValue: 0, totalDiamonds: 0, matched: false, matchType: 'missing' as const },
  ];

  it('calculates materialsCost as sum of totalDiamonds', () => {
    const result = calculateProjectEstimate(items);
    expect(result.materialsCost).toBe(7000);
  });

  it('calculates totalBlocks as sum of Quantity', () => {
    const result = calculateProjectEstimate(items);
    expect(result.totalBlocks).toBe(350);
  });

  it('calculates laborCost correctly', () => {
    const result = calculateProjectEstimate(items);
    expect(result.laborCost).toBe(350 * LABOR_RATE); // 17.5
  });

  it('calculates subtotal as materials + labor', () => {
    const result = calculateProjectEstimate(items);
    expect(result.subtotal).toBe(7000 + 350 * LABOR_RATE);
  });

  it('calculates admin fee at configured rate', () => {
    const result = calculateProjectEstimate(items);
    const expectedSubtotal = 7000 + 350 * LABOR_RATE;
    expect(result.adminFee).toBeCloseTo(expectedSubtotal * ADMIN_FEE_RATE);
  });

  it('calculates projectTotal as subtotal + adminFee', () => {
    const result = calculateProjectEstimate(items);
    expect(result.projectTotal).toBeCloseTo(result.subtotal + result.adminFee);
  });

  it('stores the adminFeeRate', () => {
    const result = calculateProjectEstimate(items);
    expect(result.adminFeeRate).toBe(ADMIN_FEE_RATE);
  });

  it('includes items array in result', () => {
    const result = calculateProjectEstimate(items);
    expect(result.items).toBe(items);
  });
});
