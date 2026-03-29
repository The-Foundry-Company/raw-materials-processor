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

export interface EstimatedItem {
  Item: string;           // minecraft:oak_log (from ProcessedItem)
  Quantity: number;       // from ProcessedItem
  Category: string;       // from ProcessedItem
  diamondValue: number;   // per-unit cost (0 if not found)
  totalDiamonds: number;  // Quantity * diamondValue
  matched: boolean;       // whether pricing entry was found
}
