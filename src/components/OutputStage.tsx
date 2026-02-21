import { motion } from 'framer-motion';
import type { ProcessedItem } from '../processor/types';
import { downloadJSON, downloadTXT } from '../utils/download';

interface Props {
  items: ProcessedItem[];
  onReset: () => void;
}

export default function OutputStage({ items, onReset }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary */}
      <div className="border-[3px] border-foundry-dark bg-foundry-yellow/20 px-4 py-3 mb-6">
        <p className="font-black text-foundry-dark text-lg tracking-wider">
          {items.length} ITEMS PROCESSED
        </p>
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
            // Reset alternating row index within each category
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
