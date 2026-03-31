/** Magnitude-aware diamond value formatter. Same-scale values get same decimal count. */
export function formatDiamondValue(value: number): string {
  if (value >= 100) return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (value >= 1) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 0.01) return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return value.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

/** Format total with 2 decimal places, always rounding up (price estimator rule). */
export function formatTotal(value: number): string {
  const rounded = Math.ceil(value * 100) / 100;
  return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
