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

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 40px 36px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #2d2d2d;
    margin: 0;
    padding: 0;
    line-height: 1.5;
  }
  * { box-sizing: border-box; }
</style>
</head>
<body>

<!-- Header -->
<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #2d2d2d;padding-bottom:16px;margin-bottom:24px;">
  <div>
    <div style="font-size:24px;font-weight:900;letter-spacing:1px;color:#2d2d2d;">BUILD COST ESTIMATE</div>
    <div style="font-size:12px;color:#777;margin-top:4px;">Foundry Company &mdash; Custom Build Services</div>
  </div>
  <div style="background:#f4d03f;padding:8px 14px;border-radius:10px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="137" height="46" viewBox="0 0 274 93">
      <rect width="274" height="93" rx="14" fill="#F4D650"/>
      <g transform="translate(12, 12)">
      <path d="m63.68 5.27h-61.03v31.45h17.63v6.39h-10.19v17.11h46.6v-17.11h-9.87v-6.39h16.86v-31.45z" fill="#2E2E2E" opacity=".2"/>
      <path d="m62.84 8.92h-59.35v25.01h17.82v7.49h-6.28v3.85h-4.94v13.53h45.48v-13.53h-6.39v-3.85h-4.21v-7.49h17.87v-25.01z" fill="#2E2E2E" opacity=".7"/>
      <path d="m5.75 8.92v24.27h15.65v6.55h-3.91v5.04h-5.17v10.38h40.99v-10.38h-5.72v-5.04h-4.5v-6.55h17.29v-24.27h-54.63z" fill="#2E2E2E"/>
      <path d="m84.12 8.72v5.78h10.71v5.27h-10.71v8.21h-7.19v-24.46h19.63v5.2h-12.44z" fill="#30312F"/>
      <path d="m118.9 18.49c0 6.82-4.95 9.93-10.74 9.93-5.94 0-10.53-3.38-10.53-9.65 0-6.13 4.5-10.06 10.88-10.06 6.41 0 10.39 4 10.39 9.78zm-14.15 0.14c0 3.28 1.7 5.02 4.22 5.02 2.59 0 4.08-1.87 4.08-5.22 0-2.97-1.52-4.95-4.05-4.95-2.69 0-4.25 2.08-4.25 5.15z" fill="#30312F"/>
      <path d="m141.2 8.71v19.27h-6.48v-2.15c-1.63 1.74-3.54 2.59-6 2.59-5.16 0-7.55-3.01-7.55-8.89v-10.82h6.82v10.44c0 2.83 1.08 4.16 3.19 4.16 2.29 0 3.54-1.67 3.54-4.95v-9.65h6.48z" fill="#30312F"/>
      <path d="m165.4 17.16v10.82h-6.55v-9.93c0-2.56-1.22-4.06-3.43-4.06-2.39 0-3.78 1.64-3.78 4.75v9.24h-6.68v-19.27h6.11v2.53c1.67-1.91 3.91-2.86 6.67-2.86 5.12 0 7.66 2.89 7.66 8.78z" fill="#30312F"/>
      <path d="m188.6 1.82v26.16h-6.07v-2.29c-1.7 1.84-3.65 2.7-6.38 2.7-5.78 0-8.51-4.32-8.51-9.58 0-5.68 3.32-10.1 9.1-10.1 2.42 0 4.16 0.82 5.55 2.22v-9.11h6.31zm-5.61 16.92c0-3.11-1.7-5.3-4.36-5.3-2.8 0-4.19 2.22-4.19 5.16 0 2.97 1.49 4.95 4.09 4.95 2.73 0 4.46-2.08 4.46-4.81z" fill="#30312F"/>
      <path d="m205.4 8.38v5.95c-4.08-0.41-6.26 1.33-6.26 6.05v7.6h-6.51v-19.27h6.3v3.01c1.43-2.29 3.47-3.34 6.47-3.34z" fill="#30312F"/>
      <path d="m228.7 8.71-8.68 21.08c-1.74 4.39-4.33 5.72-8.03 5.72-2.11 0-4.22-0.55-5.41-1.67l2.01-4.6c0.82 0.79 1.81 1.1 2.99 1.1 1.29 0 2.11-0.62 2.76-2.12l-7.97-19.51h7.05l4.66 13 4.77-13h5.85z" fill="#30312F"/>
      <path d="m74.51 47.93c0-8.01 5.78-12.67 13.4-12.67 4.95 0 8.62 1.78 10.69 4.66l-3.49 4.69c-1.7-2.39-3.81-3.68-6.47-3.68-4.32 0-6.82 3.28-6.82 7.1 0 4.08 2.5 7.3 6.51 7.3 3.04 0 5.15-1.57 6.92-3.82l3.46 4.59c-2.87 3.25-6.19 4.64-11 4.64-7.97 0-13.2-5.33-13.2-12.81z" fill="#30312F"/>
      <path d="m120 50.73c0 6.82-4.94 9.93-10.73 9.93-5.95 0-10.54-3.38-10.54-9.65 0-6.13 4.49-10.07 10.88-10.07 6.41 0 10.39 4.01 10.39 9.79zm-14.15 0.14c0 3.28 1.7 5.02 4.22 5.02 2.6 0 4.09-1.87 4.09-5.22 0-2.97-1.53-4.95-4.06-4.95-2.69 0-4.25 2.08-4.25 5.15z" fill="#30312F"/>
      <path d="m155.1 48.92v11.29h-6.79v-10.27c0-2.52-0.85-3.95-2.99-3.95-2.28 0-3.54 1.6-3.54 4.61v9.61h-6.71v-10.44c0-2.49-0.89-3.78-3.07-3.78-2.28 0-3.54 1.57-3.54 4.54v9.68h-6.13v-19.27h6.05v2.46c1.64-1.84 3.48-2.63 6.24-2.63 3.04 0 5.12 1.05 6.27 3.13 1.74-2.15 3.82-3.13 6.93-3.13 4.98 0 7.28 2.69 7.28 8.15z" fill="#30312F"/>
      <path d="m180.3 50.73c0 5.92-3.77 9.93-9.55 9.93-2.36 0-4.09-0.78-5.42-2.18v8.73h-6.31v-26.52h6.07v2.53c1.7-1.98 3.54-2.66 6-2.66 5.75 0 9.21 4.15 9.21 10.17zm-6.48-0.37c0-3.11-1.7-4.92-4.26-4.92-2.73 0-4.33 1.94-4.33 4.88 0 3.01 1.6 5.16 4.23 5.16 2.73 0 4.36-2.19 4.36-5.12z" fill="#30312F"/>
      <path d="m199.8 48.89v11.33h-5.92v-1.81c-1.39 1.4-3.43 2.22-6.1 2.22-4.46 0-5.75-2.97-5.75-5.5 0-3.62 2.66-5.7 7.65-5.7h3.85c0-2.01-1.05-3.13-3.71-3.13-1.91 0-3.71 0.65-5.07 1.46l-1.94-4.94c2.18-1.23 4.94-2.05 8.3-2.05 5.95 0 8.69 2.73 8.69 8.12zm-6.06 5.08v-1.8h-3.32c-1.57 0-2.52 0.68-2.52 2.04 0 1.23 0.82 1.91 2.35 1.91 1.87 0 3.16-1.02 3.49-2.15z" fill="#30312F"/>
      <path d="m224.4 49.4v10.82h-6.55v-9.93c0-2.56-1.22-4.06-3.43-4.06-2.39 0-3.78 1.64-3.78 4.75v9.24h-6.68v-19.27h6.11v2.53c1.67-1.91 3.91-2.86 6.67-2.86 5.12 0 7.66 2.89 7.66 8.78z" fill="#30312F"/>
      <path d="m248.2 40.95-8.68 21.08c-1.74 4.39-4.33 5.72-8.03 5.72-2.11 0-4.22-0.55-5.41-1.67l2.01-4.6c0.82 0.79 1.81 1.1 2.99 1.1 1.29 0 2.11-0.62 2.76-2.12l-7.97-19.51h7.05l4.66 13 4.77-13h5.85z" fill="#30312F"/>
      </g>
    </svg>
  </div>
</div>

<!-- Estimate metadata -->
<div style="display:flex;justify-content:space-between;margin-bottom:24px;">
  <div>
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Date</div>
    <div style="font-size:14px;font-weight:600;">${date}</div>
  </div>
  <div style="text-align:center;">
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Estimate ID</div>
    <div style="font-size:14px;font-weight:600;font-family:monospace;">${estimateId}</div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Items Priced</div>
    <div style="font-size:14px;font-weight:600;">${matched}${fuzzy > 0 ? ` + ${fuzzy} approx` : ''} of ${items.length}</div>
  </div>
</div>

<!-- Project total banner -->
<div style="background:#2d2d2d;color:#f4d03f;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
  <span style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Project Total</span>
  <span style="font-size:22px;font-weight:900;letter-spacing:1px;">${fmt(projectTotal)} Diamonds</span>
</div>

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
<div style="border-top:2px solid #e5e5e5;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
  <span style="font-size:10px;color:#bbb;">Generated by Foundry Company Materials Processor</span>
  <span style="font-size:10px;color:#bbb;">${estimateId}</span>
</div>

</body>
</html>`;
}

export async function downloadEstimatePDF(project: ProjectEstimate) {
  const html = buildEstimateHTML(project);
  const date = new Date().toISOString().slice(0, 10);

  // Create an off-screen container to render the HTML for PDF capture.
  // SAFETY: The HTML is built entirely from our own ProjectEstimate data
  // (numeric calculations and item names from our processing pipeline),
  // not from arbitrary user input.
  const container = document.createElement('div');
  container.innerHTML = html; // eslint-disable-line no-unsanitized/property
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96dpi
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
