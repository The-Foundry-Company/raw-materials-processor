import type { ProcessedItem, ProjectEstimate, EstimatedItem } from '../processor/types';
import { countMatched } from './pricing';

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

// ── PDF Estimate ──

function groupByCategory(items: EstimatedItem[]): Map<string, EstimatedItem[]> {
  const groups = new Map<string, EstimatedItem[]>();
  for (const item of items) {
    const cat = item.Category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }
  return groups;
}

function fmt(n: number): string {
  return Math.ceil(n).toLocaleString();
}

function fmtDecimal(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Builds an HTML document for the estimate PDF.
 * SAFETY: All interpolated values come from our own ProjectEstimate pipeline
 * (numeric calculations and item names from the processor), not from user input.
 */
function buildEstimateHTML(project: ProjectEstimate): string {
  const { items, materialsCost, totalBlocks, laborRate, laborCost, subtotal, adminFeeRate, adminFee, projectTotal } = project;
  const date = new Date().toISOString().slice(0, 10);
  const { matched, fuzzy, unmatched } = countMatched(items);
  const estimateId = `FC-${date.replace(/-/g, '')}-${items.length}`;
  const categories = groupByCategory(items);

  // Build category sections
  let categorySections = '';
  for (const [category, catItems] of categories) {
    const catQty = catItems.reduce((s, i) => s + i.Quantity, 0);
    const catTotal = catItems.reduce((s, i) => s + i.totalDiamonds, 0);

    let rows = '';
    for (const item of catItems) {
      const name = item.Item;
      const fuzzyNote = item.matchType === 'fuzzy'
        ? ` <span style="color:#b45309;font-size:11px;">&asymp; ${item.fuzzyMatchedTo}</span>`
        : '';
      const rate = item.matched ? fmtDecimal(item.diamondValue, 6) : '&mdash;';
      const total = item.matched ? fmtDecimal(item.totalDiamonds) : '&mdash;';
      const style = item.matchType === 'fuzzy' ? ' style="background:#fffbeb;"' : '';

      rows += `
        <tr${style}>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;font-size:12px;">${name}${fuzzyNote}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:12px;">${item.Quantity.toLocaleString()}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:12px;color:#555;">${rate}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:12px;font-weight:600;">${total}</td>
        </tr>`;
    }

    categorySections += `
      <tr>
        <td colspan="4" style="padding:10px 10px 6px;background:#fef9e7;font-weight:800;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#2d2d2d;border-bottom:2px solid #f4d03f;">
          ${category}
        </td>
      </tr>
      ${rows}
      <tr style="background:#fafafa;">
        <td style="padding:6px 10px;font-weight:700;font-size:12px;border-bottom:2px solid #ddd;">${category} Total</td>
        <td style="padding:6px 10px;text-align:right;font-weight:700;font-size:12px;border-bottom:2px solid #ddd;">${catQty.toLocaleString()}</td>
        <td style="padding:6px 10px;border-bottom:2px solid #ddd;"></td>
        <td style="padding:6px 10px;text-align:right;font-weight:700;font-size:12px;border-bottom:2px solid #ddd;">${fmtDecimal(catTotal)}</td>
      </tr>`;
  }

  // Build notes
  const notes: string[] = [
    `Pricing reflects current Foundry Company rates as of ${date}.`,
    `Labor is calculated per block placed at the current rate of ${laborRate} D/block.`,
    'This estimate is subject to change based on final schematic review.',
  ];
  if (fuzzy > 0) {
    notes.push(`${fuzzy} item${fuzzy !== 1 ? 's were' : ' was'} approximate-matched to the closest database entry (marked with &asymp;).`);
  }
  if (unmatched > 0) {
    notes.push(`${unmatched} item${unmatched !== 1 ? 's' : ''} not found in the price database are excluded from the materials cost.`);
  }

  const notesHTML = notes.map(n => `<li style="margin-bottom:4px;color:#555;font-size:11px;">${n}</li>`).join('');

  // NOTE: html2canvas has poor flexbox support — use tables for all side-by-side layouts.
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2d2d2d;line-height:1.5;padding:24px;">

<!-- Header -->
<table style="width:100%;border-collapse:collapse;border-bottom:4px solid #2d2d2d;margin-bottom:24px;">
<tr>
  <td style="padding-bottom:16px;vertical-align:middle;">
    <div style="font-size:24px;font-weight:900;letter-spacing:1px;color:#2d2d2d;">BUILD COST ESTIMATE</div>
    <div style="font-size:12px;color:#777;margin-top:4px;">Foundry Company &mdash; Custom Build Services</div>
  </td>
  <td style="padding-bottom:16px;vertical-align:middle;text-align:right;">
    <img src="/logo_wordmark.svg" width="137" height="46" style="border-radius:10px;" />
  </td>
</tr>
</table>

<!-- Estimate metadata -->
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
<tr>
  <td style="vertical-align:top;">
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Date</div>
    <div style="font-size:14px;font-weight:600;">${date}</div>
  </td>
  <td style="vertical-align:top;text-align:center;">
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Estimate ID</div>
    <div style="font-size:14px;font-weight:600;font-family:monospace;">${estimateId}</div>
  </td>
  <td style="vertical-align:top;text-align:right;">
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Items Priced</div>
    <div style="font-size:14px;font-weight:600;">${matched}${fuzzy > 0 ? ` + ${fuzzy} approx` : ''} of ${items.length}</div>
  </td>
</tr>
</table>

<!-- Project total banner -->
<table style="width:100%;border-collapse:collapse;background:#2d2d2d;margin-bottom:24px;">
<tr>
  <td style="padding:16px 20px;color:#f4d03f;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Project Total</td>
  <td style="padding:16px 20px;color:#f4d03f;font-size:22px;font-weight:900;letter-spacing:1px;text-align:right;">${fmt(projectTotal)} Diamonds</td>
</tr>
</table>

<!-- Materials breakdown table -->
<div style="font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#2d2d2d;margin-bottom:8px;">Materials Breakdown</div>
<table style="width:100%;border-collapse:collapse;border:2px solid #2d2d2d;margin-bottom:24px;">
  <thead>
    <tr style="background:#2d2d2d;color:#f4d03f;">
      <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;letter-spacing:1px;">MATERIAL</th>
      <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1px;">QTY</th>
      <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1px;">RATE (D)</th>
      <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1px;">SUBTOTAL (D)</th>
    </tr>
  </thead>
  <tbody>
    ${categorySections}
  </tbody>
  <tfoot>
    <tr style="background:#2d2d2d;color:#f4d03f;">
      <td style="padding:10px;font-weight:800;font-size:12px;letter-spacing:1px;">MATERIALS TOTAL</td>
      <td style="padding:10px;text-align:right;font-weight:700;font-size:12px;">${totalBlocks.toLocaleString()}</td>
      <td style="padding:10px;"></td>
      <td style="padding:10px;text-align:right;font-weight:800;font-size:12px;">${fmtDecimal(materialsCost)}</td>
    </tr>
  </tfoot>
</table>

<!-- Cost breakdown -->
<div style="font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#2d2d2d;margin-bottom:8px;">Cost Breakdown</div>
<table style="width:100%;border-collapse:collapse;border:2px solid #2d2d2d;margin-bottom:24px;">
  <tbody>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;">Materials Cost</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:13px;font-weight:600;">${fmtDecimal(materialsCost)} D</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;">Labor <span style="color:#777;font-size:11px;">(${totalBlocks.toLocaleString()} blocks &times; ${laborRate} D/block)</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:13px;font-weight:600;">${fmtDecimal(laborCost)} D</td>
    </tr>
    <tr style="background:#fafafa;">
      <td style="padding:10px 12px;border-bottom:2px solid #ddd;font-size:13px;font-weight:700;">Subtotal</td>
      <td style="padding:10px 12px;border-bottom:2px solid #ddd;text-align:right;font-size:13px;font-weight:700;">${fmtDecimal(subtotal)} D</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;">Administration Fee <span style="color:#777;font-size:11px;">(${(adminFeeRate * 100).toFixed(0)}%)</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:13px;font-weight:600;">${fmtDecimal(adminFee)} D</td>
    </tr>
    <tr style="background:#2d2d2d;color:#f4d03f;">
      <td style="padding:12px;font-size:14px;font-weight:800;letter-spacing:1px;">PROJECT TOTAL</td>
      <td style="padding:12px;text-align:right;font-size:16px;font-weight:900;">${fmt(projectTotal)} D</td>
    </tr>
  </tbody>
</table>

<!-- Notes -->
<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;margin-bottom:6px;">Notes</div>
<ul style="padding-left:18px;margin:0 0 24px 0;">
  ${notesHTML}
</ul>

<!-- Footer -->
<table style="width:100%;border-collapse:collapse;border-top:2px solid #e5e5e5;">
<tr>
  <td style="padding-top:12px;font-size:10px;color:#bbb;">Generated by Foundry Company Materials Processor</td>
  <td style="padding-top:12px;font-size:10px;color:#bbb;text-align:right;">${estimateId}</td>
</tr>
</table>

</div>`;
}

export async function downloadEstimatePDF(project: ProjectEstimate) {
  const html = buildEstimateHTML(project);
  const date = new Date().toISOString().slice(0, 10);

  // Create a hidden container that stays in the layout flow for html2canvas.
  // SAFETY: The HTML is built entirely from our own ProjectEstimate data
  // (numeric calculations and item names from our processing pipeline),
  // not from arbitrary user input.
  const container = document.createElement('div');
  container.innerHTML = html; // eslint-disable-line no-unsanitized/property
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96dpi
  container.style.opacity = '0';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `foundry_estimate_${date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
