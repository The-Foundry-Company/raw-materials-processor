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
