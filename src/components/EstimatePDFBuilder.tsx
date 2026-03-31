import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import type { ProjectEstimate, EstimatedItem } from '../processor/types';
import { countMatched } from '../utils/pricing';
import { formatDiamondValue, formatTotal } from '../utils/format';

// ── Timing ──

const HEADER_DELAY = 0;
const META_DELAY = 300;
const TOTAL_BANNER_DELAY = 600;
const TABLE_HEADER_DELAY = 900;
const CATEGORY_BASE_DELAY = 1050;
const CATEGORY_STAGGER = 150;
const ROW_STAGGER = 30;
const POST_TABLE_OFFSET = 300;
const COST_ROW_STAGGER = 100;
const NOTES_OFFSET = 300;
const FOOTER_OFFSET = 200;
const CAPTURE_WAIT = 800;

function groupByCategory(items: EstimatedItem[]): [string, EstimatedItem[]][] {
  const groups = new Map<string, EstimatedItem[]>();
  for (const item of items) {
    if (!groups.has(item.Category)) groups.set(item.Category, []);
    groups.get(item.Category)!.push(item);
  }
  return Array.from(groups);
}

// ── Animated section wrapper ──

function Section({ delay, children, animation = 'fadeUp' }: {
  delay: number;
  children: React.ReactNode;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleX' | 'scaleY';
}) {
  const variants = {
    fadeUp: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
    fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slideLeft: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
    slideRight: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
    scaleX: { initial: { opacity: 0, scaleX: 0 }, animate: { opacity: 1, scaleX: 1 } },
    scaleY: { initial: { opacity: 0, scaleY: 0 }, animate: { opacity: 1, scaleY: 1 } },
  };
  const v = variants[animation];
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      transition={{ duration: 0.35, delay: delay / 1000, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ── Public handle ──

export interface PDFBuilderHandle {
  getContainer: () => HTMLDivElement | null;
}

// ── Component ──

interface Props {
  projectEstimate: ProjectEstimate;
  onBuilt: () => void;
}

const EstimatePDFBuilder = forwardRef<PDFBuilderHandle, Props>(
  function EstimatePDFBuilder({ projectEstimate, onBuilt }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [builtFired, setBuiltFired] = useState(false);

    useImperativeHandle(ref, () => ({
      getContainer: () => containerRef.current,
    }));

    const { items, materialsCost, totalBlocks, laborRate, laborCost, subtotal, adminFeeRate, adminFee, projectTotal } = projectEstimate;
    const date = new Date().toISOString().slice(0, 10);
    const { matched, fuzzy, unmatched } = countMatched(items);
    const estimateId = `FC-${date.replace(/-/g, '')}-${items.length}`;
    const categories = useMemo(() => groupByCategory(items), [items]);

    // Calculate total animation duration
    const totalCategoryRows = categories.reduce((s, [, catItems]) => s + catItems.length, 0);
    const lastCategoryDelay = CATEGORY_BASE_DELAY + (categories.length - 1) * CATEGORY_STAGGER + totalCategoryRows * ROW_STAGGER;
    const footerDelay = lastCategoryDelay + POST_TABLE_OFFSET;
    const costBreakdownStart = footerDelay + 200;
    const costRows = 5; // materials, labor, subtotal, admin, total
    const projectTotalDelay = costBreakdownStart + 200 + (costRows - 1) * COST_ROW_STAGGER;
    const notesDelay = projectTotalDelay + NOTES_OFFSET;
    const docFooterDelay = notesDelay + FOOTER_OFFSET;
    const totalDuration = docFooterDelay + CAPTURE_WAIT;

    // Auto-scroll to track document assembly
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const interval = setInterval(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
      const timeout = setTimeout(() => clearInterval(interval), totalDuration + 500);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [totalDuration]);

    // Fire onBuilt after all animations complete
    useEffect(() => {
      if (builtFired) return;
      const timer = setTimeout(() => {
        setBuiltFired(true);
        onBuilt();
      }, totalDuration);
      return () => clearTimeout(timer);
    }, [totalDuration, onBuilt, builtFired]);

    // Build notes
    const notes: string[] = [
      `Pricing reflects current Foundry Company rates as of ${date}.`,
      `Labor is calculated per block placed at the current rate of ${laborRate} D/block.`,
      'This estimate is subject to change based on final schematic review.',
    ];
    if (fuzzy > 0) notes.push(`${fuzzy} item${fuzzy !== 1 ? 's were' : ' was'} approximate-matched to the closest database entry.`);
    if (unmatched > 0) notes.push(`${unmatched} item${unmatched !== 1 ? 's' : ''} not found in the price database are excluded from the materials cost.`);

    // Track row delay offset for categories
    let categoryRowOffset = 0;

    return (
      <div className="py-4">
        {/* Capture container — this is what html2pdf targets */}
        <div
          ref={containerRef}
          className="bg-white border-[3px] border-foundry-dark p-6 mx-auto"
          style={{ maxWidth: 794 }}
        >
          {/* Header: Logo + Title */}
          <Section delay={HEADER_DELAY} animation="slideLeft">
            <div className="flex items-center justify-between border-b-4 border-foundry-dark pb-4 mb-5">
              <div>
                <div className="text-2xl font-black tracking-wider text-foundry-dark">BUILD COST ESTIMATE</div>
                <div className="text-xs text-foundry-dark/50 mt-1 tracking-wide">FOUNDRY COMPANY &mdash; CUSTOM BUILD SERVICES</div>
              </div>
              <img src="/logo_wordmark.svg" width={137} height={46} className="rounded-lg" alt="Foundry Company" />
            </div>
          </Section>

          {/* Metadata row */}
          <Section delay={META_DELAY} animation="fadeUp">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <div className="text-[10px] text-foundry-dark/40 uppercase tracking-widest font-bold">Date</div>
                <div className="text-sm font-bold text-foundry-dark">{date}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-foundry-dark/40 uppercase tracking-widest font-bold">Estimate ID</div>
                <div className="text-sm font-bold font-mono text-foundry-dark">{estimateId}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-foundry-dark/40 uppercase tracking-widest font-bold">Items Priced</div>
                <div className="text-sm font-bold text-foundry-dark">{matched}{fuzzy > 0 ? ` + ${fuzzy} approx` : ''} of {items.length}</div>
              </div>
            </div>
          </Section>

          {/* Project Total Banner */}
          <Section delay={TOTAL_BANNER_DELAY} animation="scaleX">
            <div className="bg-foundry-dark flex justify-between items-center px-5 py-4 mb-5" style={{ transformOrigin: 'left' }}>
              <span className="text-foundry-yellow font-bold text-xs tracking-[3px] uppercase">Project Total</span>
              <span className="text-foundry-yellow font-black text-xl tracking-wide">{Math.ceil(projectTotal).toLocaleString()} DIAMONDS</span>
            </div>
          </Section>

          {/* Materials Breakdown Header */}
          <Section delay={TABLE_HEADER_DELAY} animation="fadeIn">
            <div className="text-xs font-black tracking-[2px] uppercase text-foundry-dark mb-2">Materials Breakdown</div>
          </Section>

          {/* Materials Table */}
          <div className="border-[2px] border-foundry-dark mb-5 overflow-hidden">
            {/* Table header */}
            <Section delay={TABLE_HEADER_DELAY + 50} animation="fadeIn">
              <div className="grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-3 px-3 py-2 bg-foundry-dark text-foundry-yellow font-bold text-[10px] tracking-wider">
                <span>MATERIAL</span>
                <span className="text-right">QTY</span>
                <span className="text-right">RATE (D)</span>
                <span className="text-right">SUBTOTAL (D)</span>
              </div>
            </Section>

            {/* Category groups */}
            {categories.map(([category, catItems], catIdx) => {
              const catDelay = CATEGORY_BASE_DELAY + catIdx * CATEGORY_STAGGER + categoryRowOffset * ROW_STAGGER;
              const catQty = catItems.reduce((s, i) => s + i.Quantity, 0);
              const catTotal = catItems.reduce((s, i) => s + i.totalDiamonds, 0);

              const rows = catItems.map((item, rowIdx) => {
                const rowDelay = catDelay + 80 + rowIdx * ROW_STAGGER;
                const isFuzzy = item.matchType === 'fuzzy';
                const rowBg = isFuzzy ? 'bg-amber-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-foundry-dark/5';

                return (
                  <Section key={item.Item} delay={rowDelay} animation="fadeIn">
                    <div className={`grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-3 px-3 py-1.5 font-mono text-xs ${rowBg}`}>
                      <span className="text-foundry-dark truncate">
                        {item.Item}
                        {isFuzzy && <span className="text-amber-600/60 text-[10px] ml-1">&asymp; {item.fuzzyMatchedTo}</span>}
                      </span>
                      <span className="text-foundry-dark font-bold tabular-nums text-right">{item.Quantity.toLocaleString()}</span>
                      {item.matched ? (
                        <>
                          <span className="text-foundry-dark/60 tabular-nums text-right">{isFuzzy ? '~' : ''}{formatDiamondValue(item.diamondValue)}</span>
                          <span className="text-foundry-dark font-bold tabular-nums text-right">{formatTotal(item.totalDiamonds)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-foundry-dark/20 text-right">&mdash;</span>
                          <span className="text-foundry-dark/20 text-right">&mdash;</span>
                        </>
                      )}
                    </div>
                  </Section>
                );
              });

              categoryRowOffset += catItems.length;

              return (
                <div key={category} style={{ breakInside: 'avoid' }}>
                  <Section delay={catDelay} animation="slideLeft">
                    <div className="px-3 py-1.5 bg-foundry-yellow/30 font-black text-foundry-dark text-[10px] tracking-[2px] uppercase border-t border-foundry-dark/10">
                      {category}
                    </div>
                  </Section>
                  {rows}
                  <Section delay={catDelay + 80 + catItems.length * ROW_STAGGER} animation="fadeIn">
                    <div className="grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-3 px-3 py-1.5 bg-foundry-dark/5 font-mono text-xs border-t border-foundry-dark/10">
                      <span className="font-bold text-foundry-dark">{category} Total</span>
                      <span className="font-bold text-foundry-dark tabular-nums text-right">{catQty.toLocaleString()}</span>
                      <span />
                      <span className="font-bold text-foundry-dark tabular-nums text-right">{formatTotal(catTotal)}</span>
                    </div>
                  </Section>
                </div>
              );
            })}

            {/* Materials total footer */}
            <Section delay={footerDelay} animation="fadeUp">
              <div className="grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-3 px-3 py-2 bg-foundry-dark text-foundry-yellow font-bold text-xs">
                <span className="tracking-wider">MATERIALS TOTAL</span>
                <span className="tabular-nums text-right">{totalBlocks.toLocaleString()}</span>
                <span />
                <span className="tabular-nums text-right font-black">{formatTotal(materialsCost)}</span>
              </div>
            </Section>
          </div>

          {/* Cost Breakdown */}
          <Section delay={costBreakdownStart} animation="fadeIn">
            <div className="text-xs font-black tracking-[2px] uppercase text-foundry-dark mb-2">Cost Breakdown</div>
          </Section>

          <div className="border-[2px] border-foundry-dark mb-5 overflow-hidden" style={{ breakInside: 'avoid' }}>
            <Section delay={costBreakdownStart + COST_ROW_STAGGER} animation="slideRight">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 font-mono text-xs border-b border-foundry-dark/10">
                <span className="text-foundry-dark">Materials Cost</span>
                <span className="text-foundry-dark font-bold tabular-nums">{formatTotal(materialsCost)} D</span>
              </div>
            </Section>
            <Section delay={costBreakdownStart + COST_ROW_STAGGER * 2} animation="slideRight">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 font-mono text-xs border-b border-foundry-dark/10">
                <span className="text-foundry-dark">Labor <span className="text-foundry-dark/40">({totalBlocks.toLocaleString()} blocks &times; {laborRate} D/block)</span></span>
                <span className="text-foundry-dark font-bold tabular-nums">{formatTotal(laborCost)} D</span>
              </div>
            </Section>
            <Section delay={costBreakdownStart + COST_ROW_STAGGER * 3} animation="slideRight">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 font-mono text-xs bg-foundry-dark/5 border-b-[2px] border-foundry-dark/20">
                <span className="text-foundry-dark font-bold">Subtotal</span>
                <span className="text-foundry-dark font-bold tabular-nums">{formatTotal(subtotal)} D</span>
              </div>
            </Section>
            <Section delay={costBreakdownStart + COST_ROW_STAGGER * 4} animation="slideRight">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 font-mono text-xs border-b border-foundry-dark/10">
                <span className="text-foundry-dark">Administration Fee <span className="text-foundry-dark/40">({(adminFeeRate * 100).toFixed(0)}%)</span></span>
                <span className="text-foundry-dark font-bold tabular-nums">{formatTotal(adminFee)} D</span>
              </div>
            </Section>
            <Section delay={projectTotalDelay} animation="scaleY">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-3 bg-foundry-dark text-foundry-yellow" style={{ transformOrigin: 'top' }}>
                <span className="font-black text-xs tracking-[2px]">PROJECT TOTAL</span>
                <span className="font-black tabular-nums text-base">{Math.ceil(projectTotal).toLocaleString()} D</span>
              </div>
            </Section>
          </div>

          {/* Notes */}
          <Section delay={notesDelay} animation="fadeIn">
            <div className="text-[10px] font-bold tracking-widest uppercase text-foundry-dark/30 mb-1">Notes</div>
            <ul className="list-disc pl-4 mb-4">
              {notes.map((note, i) => (
                <li key={i} className="text-[10px] text-foundry-dark/50 mb-0.5 leading-relaxed">{note}</li>
              ))}
            </ul>
          </Section>

          {/* Footer */}
          <Section delay={docFooterDelay} animation="fadeIn">
            <div className="border-t-[2px] border-foundry-dark/10 pt-3 flex justify-between items-center">
              <span className="text-[9px] text-foundry-dark/25">Generated by Foundry Company Materials Processor</span>
              <span className="text-[9px] text-foundry-dark/25 font-mono">{estimateId}</span>
            </div>
          </Section>
        </div>

        {/* Capture status indicator (below document) */}
        {builtFired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4"
          >
            <span className="text-foundry-dark/40 text-xs font-mono tracking-widest">PREPARING DOWNLOAD...</span>
          </motion.div>
        )}

        {/* Scroll anchor — Lenis scrolls here during build */}
        <div ref={scrollAnchorRef} />
      </div>
    );
  },
);

export default EstimatePDFBuilder;
