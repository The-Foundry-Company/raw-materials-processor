import type { ProcessedItem, EstimatedItem } from '../processor/types';
import { calculateTotalDiamonds } from './pricing';

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON(items: ProcessedItem[]) {
  const json = JSON.stringify(items, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(json, `processed_materials_${date}.json`, 'application/json');
}

export function downloadTXT(items: ProcessedItem[]) {
  const date = new Date().toISOString().slice(0, 10);
  const maxNameLen = Math.max(...items.map((i) => i.Item.length));

  const lines = [
    '═══════════════════════════════════════════════════════',
    '  FOUNDRY COMPANY — PROCESSED MATERIALS LIST',
    '═══════════════════════════════════════════════════════',
    '',
    `  Date:  ${date}`,
    `  Items: ${items.length}`,
    '',
    '───────────────────────────────────────────────────────',
  ];

  let currentCategory = '';
  for (const item of items) {
    if (item.Category !== currentCategory) {
      currentCategory = item.Category;
      lines.push('');
      lines.push(`  ── ${currentCategory.toUpperCase()} ──`);
      lines.push('');
    }
    lines.push(
      `  ${item.Item.padEnd(maxNameLen + 2)} × ${String(item.Quantity).padStart(5)}`
    );
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────');
  lines.push(`  TOTAL UNIQUE ITEMS: ${items.length}`);
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  triggerDownload(lines.join('\n'), `processed_materials_${date}.txt`, 'text/plain');
}

export function downloadEstimateTXT(estimate: EstimatedItem[]) {
  const date = new Date().toISOString().slice(0, 10);
  const total = calculateTotalDiamonds(estimate);
  const maxNameLen = Math.max(...estimate.map((i) => i.Item.length));

  const lines = [
    '═══════════════════════════════════════════════════════════════════',
    '  FOUNDRY COMPANY — BUILD COST ESTIMATE',
    '═══════════════════════════════════════════════════════════════════',
    '',
    `  Date:     ${date}`,
    `  Items:    ${estimate.length}`,
    `  Matched:  ${estimate.filter((i) => i.matched).length}`,
    `  Total:    ${total.toLocaleString()} Diamonds`,
    '',
    '───────────────────────────────────────────────────────────────────',
  ];

  let currentCategory = '';
  for (const item of estimate) {
    if (item.Category !== currentCategory) {
      currentCategory = item.Category;
      lines.push('');
      lines.push(`  ── ${currentCategory.toUpperCase()} ──`);
      lines.push('');
    }
    const dPerItem = item.matched ? String(item.diamondValue).padStart(6) : '    --';
    const dTotal = item.matched
      ? String(item.totalDiamonds.toLocaleString()).padStart(8)
      : '      --';
    lines.push(
      `  ${item.Item.padEnd(maxNameLen + 2)} × ${String(item.Quantity).padStart(5)}  @${dPerItem}D  = ${dTotal}D`,
    );
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push(`  GRAND TOTAL: ${total.toLocaleString()} DIAMONDS`);
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');

  triggerDownload(lines.join('\n'), `build_estimate_${date}.txt`, 'text/plain');
}
