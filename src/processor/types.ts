export interface ResultEntry {
  ResultItem: string;
  ResultTotal: number;
}

export interface RawItemGroup {
  RawItem: string;
  TotalEstimate: number;
  Steps: unknown[];
  Results: ResultEntry[];
}

export type RawInput = RawItemGroup[];

export interface ProcessedItem {
  Item: string;
  Quantity: number;
  Category: string;
}

export type Classification =
  | 'FUNCTIONAL'
  | 'PROCESSED_BLOCK'
  | 'VARIANT'
  | 'PASS_THROUGH'
  | 'UNKNOWN';

export interface ClassifiedItem {
  item: string;
  quantity: number;
  classification: Classification;
  baseBlock?: string;
  ratio?: number;
}

// ── Estimate types ──

export interface PricingEntry {
  itemId: string;       // Plain name from spreadsheet (e.g., "wood")
  diamondValue: number; // Diamonds per item
}

export type MatchType = 'exact' | 'fuzzy' | 'missing';

export interface EstimatedItem {
  Item: string;           // minecraft:oak_log (from ProcessedItem)
  Quantity: number;       // from ProcessedItem
  Category: string;       // from ProcessedItem
  diamondValue: number;   // per-unit cost (0 if not found)
  totalDiamonds: number;  // Quantity * diamondValue
  matched: boolean;       // true for exact+fuzzy, false for missing
  matchType: MatchType;
  fuzzyMatchedTo?: string; // populated only for fuzzy matches
}

export interface ProjectEstimate {
  items: EstimatedItem[];
  materialsCost: number;
  totalBlocks: number;
  laborCost: number;
  subtotal: number;
  adminFeeRate: number;
  adminFee: number;
  projectTotal: number;
}
