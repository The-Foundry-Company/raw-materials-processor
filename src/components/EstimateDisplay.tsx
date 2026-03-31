import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectEstimate } from '../processor/types';
import { calculateTotalDiamonds, countMatched } from '../utils/pricing';
import { captureElementAsPDF } from '../utils/download';
import { formatDiamondValue, formatTotal } from '../utils/format';
import PretextBlock from './ui/PretextBlock';
import { fontShorthand, lineHeightPx } from '../lib/pretext';
import EstimatePDFBuilder from './EstimatePDFBuilder';

type PDFState = 'viewing' | 'building' | 'capturing' | 'restoring';

interface Props {
  projectEstimate: ProjectEstimate;
}

export default function EstimateDisplay({ projectEstimate }: Props) {
  const { items, materialsCost, totalBlocks, laborRate, laborCost, subtotal, adminFeeRate, adminFee, projectTotal } = projectEstimate;
  const total = calculateTotalDiamonds(items);
  const { matched, fuzzy, unmatched } = countMatched(items);

  const [pdfState, setPdfState] = useState<PDFState>('viewing');
  const builderRef = useRef<import('./EstimatePDFBuilder').PDFBuilderHandle>(null);

  const handleDownload = useCallback(() => {
    setPdfState('building');
  }, []);

  const handleBuilt = useCallback(async () => {
    setPdfState('capturing');
    const container = builderRef.current?.getContainer();
    if (container) {
      await captureElementAsPDF(container);
    }
    setPdfState('restoring');
    setTimeout(() => setPdfState('viewing'), 400);
  }, []);

  return (
    <div>
    <AnimatePresence mode="wait">
    {pdfState === 'building' || pdfState === 'capturing' ? (
      <motion.div
        key="pdf-builder"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <EstimatePDFBuilder
          ref={builderRef}
          projectEstimate={projectEstimate}
          onBuilt={handleBuilt}
        />
      </motion.div>
    ) : (
    <motion.div
      key="estimate-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary banner */}
      <div className="border-[3px] border-foundry-dark bg-foundry-yellow/20 px-4 py-3 mb-2">
        <PretextBlock
          as="p"
          text={`PROJECT ESTIMATE: ${Math.ceil(projectTotal).toLocaleString()} DIAMONDS`}
          font={fontShorthand(18, 'sans', 900)}
          lineHeight={lineHeightPx(18, 'tight')}
          className="font-black text-foundry-dark text-lg tracking-wider"
        >
          PROJECT ESTIMATE: {Math.ceil(projectTotal).toLocaleString()} DIAMONDS
        </PretextBlock>
      </div>

      {/* Match status messages */}
      <div className="px-4 py-2 mb-4 space-y-1">
        {fuzzy > 0 && (
          <p className="text-amber-600/70 text-xs font-mono tracking-wide">
            {fuzzy} ITEM{fuzzy !== 1 ? 'S' : ''} FUZZY-MATCHED TO CLOSEST DATABASE ENTRY
          </p>
        )}
        {unmatched > 0 && (
          <p className="text-foundry-dark/40 text-xs font-mono tracking-wide">
            {unmatched} OF {items.length} ITEMS NOT IN PRICE DATABASE &mdash; SHOWN AS 0
          </p>
        )}
      </div>

      {/* Estimate table */}
      <div className="border-[3px] border-foundry-dark bg-white overflow-hidden mb-4">
        <div className="grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-4 px-4 py-2 bg-foundry-dark text-foundry-yellow font-bold text-sm tracking-wider">
          <span>ITEM</span>
          <span className="text-right">QTY</span>
          <span className="text-right">D/ITEM</span>
          <span className="text-right">TOTAL</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.map((item, i) => {
            const showHeader = i === 0 || item.Category !== items[i - 1].Category;
            let rowInCategory = 0;
            if (!showHeader) {
              for (let j = i - 1; j >= 0; j--) {
                if (items[j].Category !== item.Category) break;
                rowInCategory++;
              }
            }

            const isFuzzy = item.matchType === 'fuzzy';
            const rowBg = isFuzzy
              ? 'bg-amber-50'
              : rowInCategory % 2 === 0
                ? 'bg-white'
                : 'bg-foundry-dark/5';

            return (
              <div key={item.Item}>
                {showHeader && (
                  <div className="px-4 py-2 bg-foundry-yellow/30 font-black text-foundry-dark text-xs tracking-widest border-t-[2px] border-foundry-dark/10 first:border-t-0">
                    {item.Category.toUpperCase()}
                  </div>
                )}
                <div
                  className={`grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-4 px-4 py-2 font-mono text-sm ${rowBg}`}
                >
                  <span className="text-foundry-dark">
                    {item.Item}
                    {isFuzzy && (
                      <span className="text-amber-600/60 text-xs ml-2">
                        ~ {item.fuzzyMatchedTo}
                      </span>
                    )}
                  </span>
                  <span className="text-foundry-dark font-bold tabular-nums text-right">
                    {item.Quantity.toLocaleString()}
                  </span>
                  {item.matched ? (
                    <>
                      <span className="text-foundry-dark/70 tabular-nums text-right">
                        {isFuzzy ? '~' : ''}{formatDiamondValue(item.diamondValue)}
                      </span>
                      <span className="text-foundry-dark font-bold tabular-nums text-right">
                        {formatTotal(item.totalDiamonds)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-foundry-dark/25 text-right">&ndash;&ndash;</span>
                      <span className="text-foundry-dark/25 text-right">&ndash;&ndash;</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Grand total footer */}
          <div className="grid grid-cols-[1fr_4.5rem_7rem_5.5rem] gap-x-4 px-4 py-3 border-t-[3px] border-foundry-dark bg-foundry-dark/5">
            <span className="font-black text-foundry-dark text-sm tracking-wider">
              MATERIALS TOTAL
            </span>
            <span className="text-foundry-dark font-bold tabular-nums text-right text-sm">
              {items.reduce((s, i) => s + i.Quantity, 0).toLocaleString()}
            </span>
            <span />
            <span className="text-foundry-dark font-black tabular-nums text-right text-sm">
              {formatTotal(total)}D
            </span>
          </div>
        </div>
      </div>

      {/* Project Cost Breakdown */}
      <div className="border-[3px] border-foundry-dark bg-white overflow-hidden mb-4">
        <div className="px-4 py-2 bg-foundry-dark text-foundry-yellow font-bold text-sm tracking-wider">
          PROJECT COST BREAKDOWN
        </div>
        <div className="divide-y divide-foundry-dark/10">
          <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2 font-mono text-sm">
            <span className="text-foundry-dark">MATERIALS COST</span>
            <span className="text-foundry-dark font-bold tabular-nums text-right">
              {materialsCost.toLocaleString()}D
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2 font-mono text-sm">
            <span className="text-foundry-dark">
              LABOR ({totalBlocks.toLocaleString()} blocks × {laborRate}D)
            </span>
            <span className="text-foundry-dark font-bold tabular-nums text-right">
              {Math.ceil(laborCost).toLocaleString()}D
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2 font-mono text-sm border-t-[2px] border-foundry-dark/20">
            <span className="text-foundry-dark font-bold">SUBTOTAL</span>
            <span className="text-foundry-dark font-bold tabular-nums text-right">
              {Math.ceil(subtotal).toLocaleString()}D
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2 font-mono text-sm">
            <span className="text-foundry-dark">
              ADMIN FEE ({(adminFeeRate * 100).toFixed(0)}%)
            </span>
            <span className="text-foundry-dark font-bold tabular-nums text-right">
              {Math.ceil(adminFee).toLocaleString()}D
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-3 border-t-[3px] border-foundry-dark bg-foundry-yellow/10">
            <span className="font-black text-foundry-dark text-sm tracking-wider">
              PROJECT TOTAL
            </span>
            <span className="text-foundry-dark font-black tabular-nums text-right text-sm">
              {Math.ceil(projectTotal).toLocaleString()}D
            </span>
          </div>
        </div>
      </div>

      {/* Matched items summary */}
      <div className="px-4 py-2 mb-4">
        <p className="text-foundry-dark/40 text-xs font-mono tracking-wide">
          {matched} EXACT{fuzzy > 0 ? ` + ${fuzzy} FUZZY` : ''} PRICED &middot; {Math.ceil(projectTotal).toLocaleString()} DIAMONDS PROJECT TOTAL
        </p>
      </div>

      {/* Download estimate */}
      <button
        onClick={handleDownload}
        className="w-full py-3 bg-foundry-dark text-foundry-yellow font-black tracking-wider
          border-[3px] border-foundry-dark text-sm
          hover:bg-foundry-yellow hover:text-foundry-dark mb-4"
      >
        DOWNLOAD ESTIMATE (PDF)
      </button>
    </motion.div>
    )}
    </AnimatePresence>
    </div>
  );
}
