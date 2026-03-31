import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  generateEstimate,
  calculateTotalDiamonds,
  countMatched,
  calculateProjectEstimate,
} from '../pricing';
import type { ProcessedItem, PricingEntry, PricingMetadata } from '../../processor/types';

describe('parseCSV', () => {
  it('parses standard CSV with header', () => {
    const csv = 'Item ID,Value in D/item\noak_log,50\nstone,10';
    const result = parseCSV(csv);
    expect(result.entries).toEqual([
      { itemId: 'oak_log', diamondValue: 50 },
      { itemId: 'stone', diamondValue: 10 },
    ]);
    expect(result.metadata).toEqual({ laborRate: 7, adminFeeRate: 0.02 });
  });

  it('strips minecraft: prefix from item IDs', () => {
    const csv = 'Item ID,Value\nminecraft:sandstone,100\nsandstone,100';
    const result = parseCSV(csv);
    expect(result.entries[0].itemId).toBe('sandstone');
    expect(result.entries[1].itemId).toBe('sandstone');
  });

  it('handles empty lines and malformed entries', () => {
    const csv = 'header\n\noak_log,50\nbadline\n,30\nstone,abc';
    const result = parseCSV(csv);
    expect(result.entries).toEqual([{ itemId: 'oak_log', diamondValue: 50 }]);
  });

  it('returns empty array for header-only CSV', () => {
    expect(parseCSV('header').entries).toEqual([]);
    expect(parseCSV('').entries).toEqual([]);
  });

  it('lowercases item IDs', () => {
    const csv = 'h\nOAK_LOG,50\nMinecraft:Stone,10';
    const result = parseCSV(csv);
    expect(result.entries[0].itemId).toBe('oak_log');
    expect(result.entries[1].itemId).toBe('stone');
  });

  it('extracts labor rate and admin fee from first data row', () => {
    const csv = 'Item ID,Value,,Labor Cost,Admin Fee\noak_slab,0.000549,,7,2\nspruce_slab,0.000651,,,';
    const result = parseCSV(csv);
    expect(result.metadata.laborRate).toBe(7);
    expect(result.metadata.adminFeeRate).toBe(0.02); // 2 / 100
    expect(result.entries).toHaveLength(2);
  });

  it('falls back to defaults when metadata columns are empty', () => {
    const csv = 'Item ID,Value,,Labor,Admin\noak_log,50,,,\nstone,10,,,';
    const result = parseCSV(csv);
    expect(result.metadata.laborRate).toBe(7);
    expect(result.metadata.adminFeeRate).toBe(0.02);
  });

  it('falls back to defaults for 2-column CSV', () => {
    const csv = 'Item ID,Value\noak_log,50';
    const result = parseCSV(csv);
    expect(result.metadata.laborRate).toBe(7);
    expect(result.metadata.adminFeeRate).toBe(0.02);
  });

  it('takes first non-empty metadata value when multiple rows have data', () => {
    const csv = 'h,v,,l,a\noak,50,,7,2\nstone,10,,9,5';
    const result = parseCSV(csv);
    expect(result.metadata.laborRate).toBe(7);       // first row wins
    expect(result.metadata.adminFeeRate).toBe(0.02);  // first row wins (2/100)
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
  const testMetadata: PricingMetadata = { laborRate: 7, adminFeeRate: 0.02 };

  const items = [
    { Item: 'a', Quantity: 100, Category: 'Wood', diamondValue: 50, totalDiamonds: 5000, matched: true, matchType: 'exact' as const },
    { Item: 'b', Quantity: 200, Category: 'Stone', diamondValue: 10, totalDiamonds: 2000, matched: true, matchType: 'exact' as const },
    { Item: 'c', Quantity: 50, Category: 'Other', diamondValue: 0, totalDiamonds: 0, matched: false, matchType: 'missing' as const },
  ];

  it('calculates materialsCost as sum of totalDiamonds', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.materialsCost).toBe(7000);
  });

  it('calculates totalBlocks as sum of Quantity', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.totalBlocks).toBe(350);
  });

  it('calculates laborCost correctly', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.laborCost).toBe(350 * 7); // 2450
  });

  it('calculates subtotal as materials + labor', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.subtotal).toBe(7000 + 350 * 7);
  });

  it('calculates admin fee at configured rate', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    const expectedSubtotal = 7000 + 350 * 7;
    expect(result.adminFee).toBeCloseTo(expectedSubtotal * 0.02);
  });

  it('calculates projectTotal as subtotal + adminFee', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.projectTotal).toBeCloseTo(result.subtotal + result.adminFee);
  });

  it('stores the laborRate', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.laborRate).toBe(7);
  });

  it('stores the adminFeeRate', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.adminFeeRate).toBe(0.02);
  });

  it('includes items array in result', () => {
    const result = calculateProjectEstimate(items, testMetadata);
    expect(result.items).toBe(items);
  });

  it('uses provided metadata rather than hardcoded values', () => {
    const customMeta: PricingMetadata = { laborRate: 10, adminFeeRate: 0.05 };
    const result = calculateProjectEstimate(items, customMeta);
    expect(result.laborRate).toBe(10);
    expect(result.laborCost).toBe(350 * 10);
    expect(result.adminFeeRate).toBe(0.05);
    const expectedSubtotal = 7000 + 3500;
    expect(result.adminFee).toBeCloseTo(expectedSubtotal * 0.05);
  });
});
