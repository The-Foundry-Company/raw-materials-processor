import { motion } from 'framer-motion';
import type { EstimatedItem } from '../processor/types';
import { calculateTotalDiamonds, countMatched } from '../utils/pricing';
import { downloadEstimateTXT } from '../utils/download';
import PretextBlock from './ui/PretextBlock';
import { fontShorthand, lineHeightPx } from '../lib/pretext';

interface Props {
  estimate: EstimatedItem[];
}

export default function EstimateDisplay({ estimate }: Props) {
  const total = calculateTotalDiamonds(estimate);
  const { matched, unmatched } = countMatched(estimate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary banner */}
      <div className="border-[3px] border-foundry-dark bg-foundry-yellow/20 px-4 py-3 mb-2">
        <PretextBlock
          as="p"
          text={`ESTIMATE: ${total.toLocaleString()} DIAMONDS`}
          font={fontShorthand(18, 'sans', 900)}
          lineHeight={lineHeightPx(18, 'tight')}
          className="font-black text-foundry-dark text-lg tracking-wider"
        >
          ESTIMATE: {total.toLocaleString()} DIAMONDS
        </PretextBlock>
      </div>

      {/* Unmatched warning */}
      {unmatched > 0 && (
        <div className="px-4 py-2 mb-4">
          <p className="text-foundry-dark/40 text-xs font-mono tracking-wide">
            {unmatched} OF {estimate.length} ITEMS NOT IN PRICE DATABASE &mdash; SHOWN AS 0
          </p>
        </div>
      )}

      {/* Estimate table */}
      <div className="border-[3px] border-foundry-dark bg-white overflow-hidden mb-4">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2 bg-foundry-dark text-foundry-yellow font-bold text-sm tracking-wider">
          <span>ITEM</span>
          <span className="text-right">QTY</span>
          <span className="text-right">D/ITEM</span>
          <span className="text-right">TOTAL</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {estimate.map((item, i) => {
            const showHeader = i === 0 || item.Category !== estimate[i - 1].Category;
            let rowInCategory = 0;
            if (!showHeader) {
              for (let j = i - 1; j >= 0; j--) {
                if (estimate[j].Category !== item.Category) break;
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
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2 font-mono text-sm
                    ${rowInCategory % 2 === 0 ? 'bg-white' : 'bg-foundry-dark/5'}`}
                >
                  <span className="text-foundry-dark">{item.Item}</span>
                  <span className="text-foundry-dark font-bold tabular-nums text-right">
                    {item.Quantity.toLocaleString()}
                  </span>
                  {item.matched ? (
                    <>
                      <span className="text-foundry-dark/70 tabular-nums text-right">
                        {item.diamondValue}
                      </span>
                      <span className="text-foundry-dark font-bold tabular-nums text-right">
                        {item.totalDiamonds.toLocaleString()}
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
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 border-t-[3px] border-foundry-dark bg-foundry-dark/5">
            <span className="font-black text-foundry-dark text-sm tracking-wider">
              GRAND TOTAL
            </span>
            <span className="text-foundry-dark font-bold tabular-nums text-right text-sm">
              {estimate.reduce((s, i) => s + i.Quantity, 0).toLocaleString()}
            </span>
            <span />
            <span className="text-foundry-dark font-black tabular-nums text-right text-sm">
              {total.toLocaleString()}D
            </span>
          </div>
        </div>
      </div>

      {/* Matched items summary */}
      <div className="px-4 py-2 mb-4">
        <p className="text-foundry-dark/40 text-xs font-mono tracking-wide">
          {matched} ITEMS PRICED &middot; {total.toLocaleString()} DIAMONDS TOTAL
        </p>
      </div>

      {/* Download estimate */}
      <button
        onClick={() => downloadEstimateTXT(estimate)}
        className="w-full py-3 bg-foundry-dark text-foundry-yellow font-black tracking-wider
          border-[3px] border-foundry-dark text-sm
          hover:bg-foundry-yellow hover:text-foundry-dark mb-4"
      >
        DOWNLOAD ESTIMATE
      </button>
    </motion.div>
  );
}
