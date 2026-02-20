import type { RawInput, ProcessedItem, ClassifiedItem } from './types';
import {
  stripNamespace,
  addNamespace,
  isFunctional,
  PROCESSED_BLOCKS,
  resolveVariant,
} from './rules';

/**
 * Validates that the input is a valid raw materials JSON array.
 */
export function validateInput(data: unknown): data is RawInput {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'RawItem' in item &&
      'Results' in item &&
      Array.isArray(item.Results) &&
      item.Results.every(
        (r: unknown) =>
          typeof r === 'object' &&
          r !== null &&
          'ResultItem' in r &&
          'ResultTotal' in r
      )
  );
}

/**
 * Phase 1: Flatten all Results entries and deduplicate.
 * When the same ResultItem appears multiple times, take the MAX ResultTotal.
 */
function flattenAndDeduplicate(input: RawInput): Map<string, number> {
  const items = new Map<string, number>();

  for (const group of input) {
    for (const result of group.Results) {
      const existing = items.get(result.ResultItem) ?? 0;
      items.set(result.ResultItem, Math.max(existing, result.ResultTotal));
    }
  }

  return items;
}

/**
 * Phase 2: Classify each item.
 */
function classifyItem(itemId: string, quantity: number): ClassifiedItem {
  const name = stripNamespace(itemId);

  // Pass-through: RawItem == ResultItem (handled at caller level)
  // We check this by comparing raw to result, but since we've deduplicated,
  // we handle pass-through detection via a set passed in

  // Functional items
  if (isFunctional(name)) {
    return { item: itemId, quantity, classification: 'FUNCTIONAL' };
  }

  // Processed blocks
  if (PROCESSED_BLOCKS.has(name)) {
    return { item: itemId, quantity, classification: 'PROCESSED_BLOCK' };
  }

  // Variants
  const variant = resolveVariant(name);
  if (variant) {
    return {
      item: itemId,
      quantity,
      classification: 'VARIANT',
      baseBlock: variant.base,
      ratio: variant.ratio,
    };
  }

  // If we have no special handling, keep as-is (PASS_THROUGH or UNKNOWN)
  return { item: itemId, quantity, classification: 'PASS_THROUGH' };
}

/**
 * Phase 2 (extended): Build pass-through set from input.
 */
function buildPassThroughSet(input: RawInput): Set<string> {
  const passThrough = new Set<string>();
  for (const group of input) {
    for (const result of group.Results) {
      if (result.ResultItem === group.RawItem) {
        passThrough.add(result.ResultItem);
      }
    }
  }
  return passThrough;
}

/**
 * Phase 3: Consolidate variants into base blocks.
 * Phase 4: Format and sort.
 */
export function process(input: RawInput): ProcessedItem[] {
  // Phase 1: Flatten & deduplicate
  const deduplicated = flattenAndDeduplicate(input);
  const passThroughSet = buildPassThroughSet(input);

  // Remove items from pass-through if they can be decomposed (e.g., stripped logs → logs)
  for (const item of [...passThroughSet]) {
    if (resolveVariant(stripNamespace(item))) {
      passThroughSet.delete(item);
    }
  }

  // Phase 2: Classify each item
  const classified: ClassifiedItem[] = [];
  for (const [itemId, quantity] of deduplicated) {
    if (passThroughSet.has(itemId)) {
      classified.push({ item: itemId, quantity, classification: 'PASS_THROUGH' });
    } else {
      classified.push(classifyItem(itemId, quantity));
    }
  }

  // Phase 3: Consolidate variants into base blocks
  const output = new Map<string, number>();

  for (const entry of classified) {
    if (entry.classification === 'VARIANT' && entry.baseBlock && entry.ratio) {
      const baseKey = addNamespace(entry.baseBlock);
      const baseNeeded = Math.ceil(entry.quantity / entry.ratio);
      output.set(baseKey, (output.get(baseKey) ?? 0) + baseNeeded);
    } else {
      // FUNCTIONAL, PROCESSED_BLOCK, PASS_THROUGH, UNKNOWN — keep as-is
      output.set(entry.item, (output.get(entry.item) ?? 0) + entry.quantity);
    }
  }

  // Phase 3b: Recursively resolve intermediate items (planks → logs, processed → raw)
  let resolvedAny = true;
  while (resolvedAny) {
    resolvedAny = false;
    for (const [item, qty] of [...output]) {
      if (passThroughSet.has(item)) continue;
      const name = stripNamespace(item);
      const variant = resolveVariant(name);
      if (variant) {
        output.delete(item);
        const baseKey = addNamespace(variant.base);
        const baseNeeded = Math.ceil(qty / variant.ratio);
        output.set(baseKey, (output.get(baseKey) ?? 0) + baseNeeded);
        resolvedAny = true;
      }
    }
  }

  // Phase 4: Format & sort alphabetically
  const result: ProcessedItem[] = [];
  for (const [item, quantity] of output) {
    result.push({ Item: item, Quantity: quantity });
  }

  result.sort((a, b) => a.Item.localeCompare(b.Item));

  return result;
}
