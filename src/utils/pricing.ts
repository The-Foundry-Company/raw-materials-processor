import type { ProcessedItem, PricingEntry, EstimatedItem, ProjectEstimate } from '../processor/types';
import { stripNamespace } from '../processor/rules';
import { findBestMatch } from './fuzzy';

const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpLeqXAPlN4UTFuDxG3FJ55kM5fU7lXps04ZtLT2eyd8Bq2EzY_trSmtRu6eJVIed9AXIIurvKLXWJ/pub?gid=1255677024&single=true&output=csv';

export const LABOR_RATE = 0.05;      // diamonds per block placed
export const ADMIN_FEE_RATE = 0.02;  // 2% admin fee

export async function fetchPricingData(): Promise<PricingEntry[]> {
  const response = await fetch(SHEETS_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing data: ${response.status}`);
  }
  const text = await response.text();
  return parseCSV(text);
}

export function parseCSV(csv: string): PricingEntry[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return []; // header only or empty

  const entries: PricingEntry[] = [];
  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const commaIndex = line.indexOf(',');
    if (commaIndex === -1) continue;

    const rawId = line.slice(0, commaIndex).trim().toLowerCase();
    const itemId = stripNamespace(rawId); // normalize: "minecraft:sandstone" → "sandstone"
    const valueStr = line.slice(commaIndex + 1).trim();
    const diamondValue = parseFloat(valueStr);

    if (itemId && !isNaN(diamondValue)) {
      entries.push({ itemId, diamondValue });
    }
  }
  return entries;
}

export function generateEstimate(
  items: ProcessedItem[],
  pricing: PricingEntry[],
): EstimatedItem[] {
  // Build lookup map from pricing entries
  const priceMap = new Map<string, number>();
  for (const entry of pricing) {
    priceMap.set(entry.itemId, entry.diamondValue);
  }

  const candidates = Array.from(priceMap.keys());

  return items.map((item) => {
    const name = stripNamespace(item.Item);

    // Step 1: Exact match
    if (priceMap.has(name)) {
      const diamondValue = priceMap.get(name)!;
      return {
        Item: item.Item,
        Quantity: item.Quantity,
        Category: item.Category,
        diamondValue,
        totalDiamonds: item.Quantity * diamondValue,
        matched: true,
        matchType: 'exact' as const,
      };
    }

    // Step 2: Fuzzy match
    const fuzzyResult = findBestMatch(name, candidates);
    if (fuzzyResult) {
      const diamondValue = priceMap.get(fuzzyResult.match)!;
      return {
        Item: item.Item,
        Quantity: item.Quantity,
        Category: item.Category,
        diamondValue,
        totalDiamonds: item.Quantity * diamondValue,
        matched: true,
        matchType: 'fuzzy' as const,
        fuzzyMatchedTo: fuzzyResult.match,
      };
    }

    // Step 3: No match
    return {
      Item: item.Item,
      Quantity: item.Quantity,
      Category: item.Category,
      diamondValue: 0,
      totalDiamonds: 0,
      matched: false,
      matchType: 'missing' as const,
    };
  });
}

export function calculateTotalDiamonds(estimate: EstimatedItem[]): number {
  return estimate.reduce((sum, item) => sum + item.totalDiamonds, 0);
}

export function countMatched(estimate: EstimatedItem[]): {
  matched: number;
  fuzzy: number;
  unmatched: number;
} {
  let matched = 0;
  let fuzzy = 0;
  let unmatched = 0;
  for (const item of estimate) {
    if (item.matchType === 'exact') matched++;
    else if (item.matchType === 'fuzzy') fuzzy++;
    else unmatched++;
  }
  return { matched, fuzzy, unmatched };
}

export function calculateProjectEstimate(estimate: EstimatedItem[]): ProjectEstimate {
  const materialsCost = calculateTotalDiamonds(estimate);
  const totalBlocks = estimate.reduce((sum, item) => sum + item.Quantity, 0);
  const laborCost = totalBlocks * LABOR_RATE;
  const subtotal = materialsCost + laborCost;
  const adminFee = subtotal * ADMIN_FEE_RATE;
  const projectTotal = subtotal + adminFee;

  return {
    items: estimate,
    materialsCost,
    totalBlocks,
    laborCost,
    subtotal,
    adminFeeRate: ADMIN_FEE_RATE,
    adminFee,
    projectTotal,
  };
}
