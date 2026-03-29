import type { ProcessedItem, PricingEntry, EstimatedItem } from '../processor/types';
import { stripNamespace } from '../processor/rules';

const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpLeqXAPlN4UTFuDxG3FJ55kM5fU7lXps04ZtLT2eyd8Bq2EzY_trSmtRu6eJVIed9AXIIurvKLXWJ/pub?gid=1255677024&single=true&output=csv';

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

    const itemId = line.slice(0, commaIndex).trim().toLowerCase();
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

  return items.map((item) => {
    const name = stripNamespace(item.Item);
    const diamondValue = priceMap.get(name) ?? 0;
    const matched = priceMap.has(name);
    return {
      Item: item.Item,
      Quantity: item.Quantity,
      Category: item.Category,
      diamondValue,
      totalDiamonds: item.Quantity * diamondValue,
      matched,
    };
  });
}

export function calculateTotalDiamonds(estimate: EstimatedItem[]): number {
  return estimate.reduce((sum, item) => sum + item.totalDiamonds, 0);
}

export function countMatched(estimate: EstimatedItem[]): { matched: number; unmatched: number } {
  let matched = 0;
  let unmatched = 0;
  for (const item of estimate) {
    if (item.matched) matched++;
    else unmatched++;
  }
  return { matched, unmatched };
}
