import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProcessedItem, ProjectEstimate } from '../processor/types';
import { downloadJSON, downloadTXT } from '../utils/download';
import { fetchPricingData, generateEstimate, calculateProjectEstimate } from '../utils/pricing';
import PretextBlock from './ui/PretextBlock';
import { fontShorthand, lineHeightPx } from '../lib/pretext';
import EstimateAnimation from './EstimateAnimation';
import EstimateDisplay from './EstimateDisplay';

type EstimateState = 'idle' | 'loading' | 'done' | 'error';

interface Props {
  items: ProcessedItem[];
  onReset: () => void;
}

export default function OutputStage({ items, onReset }: Props) {
  const [estimateState, setEstimateState] = useState<EstimateState>('idle');
  const [projectEstimate, setProjectEstimate] = useState<ProjectEstimate | null>(null);
  const [estimateError, setEstimateError] = useState('');

  async function handleGenerateEstimate() {
    setEstimateState('loading');
    setEstimateError('');
    setProjectEstimate(null);

    try {
      const pricing = await fetchPricingData();
      const result = generateEstimate(items, pricing);
      const project = calculateProjectEstimate(result);
      setProjectEstimate(project);
    } catch (err) {
      setEstimateError(
        err instanceof Error ? err.message : 'Failed to fetch pricing data.',
      );
      setEstimateState('error');
    }
  }

  const handleAnimationComplete = useCallback(() => {
    setEstimateState('done');
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (estimateState !== 'idle') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'g' || e.key === 'G') {
        handleGenerateEstimate();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [estimateState]);

  function handleRetry() {
    setEstimateState('idle');
    setProjectEstimate(null);
    setEstimateError('');
  }

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
      <AnimatePresence mode="wait">
        {estimateState === 'idle' && (
          <motion.div
            key="estimate-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleGenerateEstimate}
              className="w-full py-3 bg-foundry-yellow text-foundry-dark font-black tracking-wider
                border-[3px] border-foundry-dark text-sm mb-4
                hover:bg-foundry-dark hover:text-foundry-yellow"
            >
              [G] GENERATE ESTIMATE
            </button>
          </motion.div>
        )}

        {estimateState === 'loading' && (
          <motion.div
            key="estimate-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EstimateAnimation
              projectEstimate={projectEstimate}
              totalItems={items.length}
              onComplete={handleAnimationComplete}
            />
          </motion.div>
        )}

        {estimateState === 'done' && projectEstimate && (
          <motion.div
            key="estimate-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EstimateDisplay projectEstimate={projectEstimate} />
          </motion.div>
        )}

        {estimateState === 'error' && (
          <motion.div
            key="estimate-error"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.8 }}
          >
            <div className="border-[3px] border-red-500 bg-red-50 px-4 py-3 mb-4">
              <span className="text-red-500 font-mono font-bold text-lg">!! </span>
              <p className="text-red-600 font-bold text-sm inline">
                {estimateError || "COULDN'T REACH THE PRICING DATABASE. CHECK YOUR CONNECTION AND TRY AGAIN."}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-foundry-yellow text-foundry-dark font-black tracking-wider
                border-[3px] border-foundry-dark text-sm mb-4
                hover:bg-foundry-dark hover:text-foundry-yellow"
            >
              RETRY ESTIMATE
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
