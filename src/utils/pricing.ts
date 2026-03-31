import type { ProcessedItem, PricingEntry, PricingMetadata, PricingData, EstimatedItem, ProjectEstimate } from '../processor/types';
import { stripNamespace } from '../processor/rules';
import { findBestMatch } from './fuzzy';

const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpLeqXAPlN4UTFuDxG3FJ55kM5fU7lXps04ZtLT2eyd8Bq2EzY_trSmtRu6eJVIed9AXIIurvKLXWJ/pub?gid=1255677024&single=true&output=csv';

const DEFAULT_LABOR_RATE = 7;        // d/block fallback
const DEFAULT_ADMIN_FEE_RATE = 0.02; // 2% fallback

export async function fetchPricingData(): Promise<PricingData> {
  const response = await fetch(SHEETS_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing data: ${response.status}`);
  }
  const text = await response.text();
  return parseCSV(text);
}

export function parseCSV(csv: string): PricingData {
  const lines = csv.trim().split('\n');
  const defaultMetadata: PricingMetadata = { laborRate: DEFAULT_LABOR_RATE, adminFeeRate: DEFAULT_ADMIN_FEE_RATE };
  if (lines.length < 2) return { entries: [], metadata: defaultMetadata };

  const entries: PricingEntry[] = [];
  let laborRate: number | null = null;
  let adminFeeRate: number | null = null;

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    if (cols.length < 2) continue;

    const rawId = cols[0].trim().toLowerCase();
    const itemId = stripNamespace(rawId);
    const diamondValue = parseFloat(cols[1].trim());

    if (itemId && !isNaN(diamondValue)) {
      entries.push({ itemId, diamondValue });
    }

    // Extract metadata from columns 4 and 5 (indices 3 and 4) — first non-empty value wins
    if (laborRate === null && cols.length > 3) {
      const val = parseFloat(cols[3].trim());
      if (!isNaN(val)) laborRate = val;
    }
    if (adminFeeRate === null && cols.length > 4) {
      const val = parseFloat(cols[4].trim());
      if (!isNaN(val)) adminFeeRate = val / 100; // spreadsheet stores "2" meaning 2%
    }
  }

  return {
    entries,
    metadata: {
      laborRate: laborRate ?? DEFAULT_LABOR_RATE,
      adminFeeRate: adminFeeRate ?? DEFAULT_ADMIN_FEE_RATE,
    },
  };
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

export function calculateProjectEstimate(
  estimate: EstimatedItem[],
  metadata: PricingMetadata,
): ProjectEstimate {
  const materialsCost = calculateTotalDiamonds(estimate);
  const totalBlocks = estimate.reduce((sum, item) => sum + item.Quantity, 0);
  const laborCost = totalBlocks * metadata.laborRate;
  const subtotal = materialsCost + laborCost;
  const adminFee = subtotal * metadata.adminFeeRate;
  const projectTotal = subtotal + adminFee;

  return {
    items: estimate,
    materialsCost,
    totalBlocks,
    laborRate: metadata.laborRate,
    laborCost,
    subtotal,
    adminFeeRate: metadata.adminFeeRate,
    adminFee,
    projectTotal,
  };
}
