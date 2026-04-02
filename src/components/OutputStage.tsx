import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ProcessedItem, ProjectEstimate } from '../processor/types';
import { downloadJSON, downloadTXT } from '../utils/download';
import PretextBlock from './ui/PretextBlock';
import { fontShorthand, lineHeightPx } from '../lib/pretext';
import EstimateDisplay from './EstimateDisplay';

interface Props {
  items: ProcessedItem[];
  projectEstimate: ProjectEstimate | null;
  onGenerateEstimate: () => void;
  onReset: () => void;
}

export default function OutputStage({ items, projectEstimate, onGenerateEstimate, onReset }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (projectEstimate) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'g' || e.key === 'G') {
        onGenerateEstimate();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectEstimate, onGenerateEstimate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary */}
      <div className="border-[3px] border-foundry-dark bg-foundry-yellow/20 px-4 py-3 mb-6">
        <PretextBlock
          as="p"
          text={`${items.length} ITEMS PROCESSED`}
          font={fontShorthand(18, 'sans', 900)}
          lineHeight={lineHeightPx(18, 'tight')}
          className="font-black text-foundry-dark text-lg tracking-wider"
        >
          {items.length} ITEMS PROCESSED
        </PretextBlock>
      </div>

      {/* Results table */}
      <div className="border-[3px] border-foundry-dark bg-white overflow-hidden mb-6">
        <div className="grid grid-cols-[1fr_auto] px-4 py-2 bg-foundry-dark text-foundry-yellow font-bold text-sm tracking-wider">
          <span>ITEM</span>
          <span>QTY</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.map((item, i) => {
            const showHeader = i === 0 || item.Category !== items[i - 1].Category;
            let rowInCategory = 0;
            if (showHeader) {
              rowInCategory = 0;
            } else {
              for (let j = i - 1; j >= 0; j--) {
                if (items[j].Category !== item.Category) break;
                rowInCategory++;
              }
            }
            return (
              <div key={item.Item}>
                {showHeader && (
                  <div className="px-4 py-2 bg-foundry-yellow/30 font-black text-foundry-dark text-xs tracking-widest border-t-[2px] border-foundry-dark/10 first:border-t-0">
                    {item.Category.toUpperCase()}
                  </div>
                )}
                <div
                  className={`grid grid-cols-[1fr_auto] px-4 py-2 font-mono text-sm
                    ${rowInCategory % 2 === 0 ? 'bg-white' : 'bg-foundry-dark/5'}`}
                >
                  <span className="text-foundry-dark">{item.Item}</span>
                  <span className="text-foundry-dark font-bold tabular-nums">
                    {item.Quantity.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Download buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => downloadJSON(items)}
          className="py-3 bg-foundry-yellow text-foundry-dark font-black tracking-wider
            border-[3px] border-foundry-dark text-sm
            hover:bg-foundry-dark hover:text-foundry-yellow"
        >
          DOWNLOAD JSON
        </button>
        <button
          onClick={() => downloadTXT(items)}
          className="py-3 bg-foundry-dark text-foundry-yellow font-black tracking-wider
            border-[3px] border-foundry-dark text-sm
            hover:bg-foundry-yellow hover:text-foundry-dark"
        >
          DOWNLOAD TXT
        </button>
      </div>

      {/* Estimate section */}
      {!projectEstimate ? (
        <button
          onClick={onGenerateEstimate}
          className="w-full py-3 bg-foundry-yellow text-foundry-dark font-black tracking-wider
            border-[3px] border-foundry-dark text-sm mb-4
            hover:bg-foundry-dark hover:text-foundry-yellow"
        >
          [G] GENERATE ESTIMATE
        </button>
      ) : (
        <EstimateDisplay projectEstimate={projectEstimate} />
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-2 bg-transparent text-foundry-dark/50 font-bold tracking-wider
          border-[2px] border-foundry-dark/20 text-sm
          hover:border-foundry-dark hover:text-foundry-dark"
      >
        START OVER
      </button>
    </motion.div>
  );
}
