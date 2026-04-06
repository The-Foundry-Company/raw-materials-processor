import type { ProcessedItem } from '../processor/types';

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

// ── PNG Summary Card (captures a DOM element as an image) ──

export async function captureElementAsImage(element: HTMLElement, filename?: string) {
  const date = new Date().toISOString().slice(0, 10);
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `foundry_estimate_${date}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF Estimate (captures a visible DOM element) ──

export async function captureElementAsPDF(element: HTMLElement, filename?: string) {
  const date = new Date().toISOString().slice(0, 10);
  const html2pdf = (await import('html2pdf.js')).default;
  await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: filename ?? `foundry_estimate_${date}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css'] },
    } as Record<string, unknown>)
    .from(element)
    .save();
}
