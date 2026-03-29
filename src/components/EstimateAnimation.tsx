import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { EstimatedItem } from '../processor/types';
import { calculateTotalDiamonds, countMatched } from '../utils/pricing';

// ── Step types (same as ProcessingStage) ──

interface Step {
  text: string;
  type: 'action' | 'stat';
}

// ── Timing (matching ProcessingStage) ──

const ACTION_DELAY = 500;
const STAT_DELAY = 250;
const COMPLETE_PADDING = 400;

// ── Pre-fetch placeholder steps ──

const PRE_FETCH_STEPS: Step[] = [
  { text: 'CONNECTING TO PRICING DATABASE...', type: 'action' },
  { text: 'FETCHING DIAMOND VALUES...', type: 'action' },
  { text: 'MATCHING ITEMS TO PRICE LIST...', type: 'action' },
];

// ── Component ──

interface Props {
  estimate: EstimatedItem[] | null;
  totalItems: number;
  onComplete: () => void;
}

export default function EstimateAnimation({ estimate, totalItems, onComplete }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  // Build full step list once estimate data arrives
  const allSteps = useMemo((): Step[] => {
    if (!estimate) return PRE_FETCH_STEPS;

    const { matched } = countMatched(estimate);
    const total = calculateTotalDiamonds(estimate);

    return [
      ...PRE_FETCH_STEPS,
      { text: `${matched} OF ${totalItems} ITEMS MATCHED`, type: 'stat' },
      { text: 'CALCULATING ESTIMATE...', type: 'action' },
      { text: `TOTAL: ${total.toLocaleString()} DIAMONDS`, type: 'stat' },
    ];
  }, [estimate, totalItems]);

  // Compute cumulative delays
  const { cumulativeDelays, totalDuration } = useMemo(() => {
    const delays = [0];
    for (let i = 1; i < allSteps.length; i++) {
      const prevDelay = allSteps[i - 1].type === 'stat' ? STAT_DELAY : ACTION_DELAY;
      delays.push(delays[i - 1] + prevDelay);
    }
    const lastDelay = allSteps[allSteps.length - 1].type === 'stat' ? STAT_DELAY : ACTION_DELAY;
    const total = delays[delays.length - 1] + lastDelay + COMPLETE_PADDING;
    return { cumulativeDelays: delays, totalDuration: total };
  }, [allSteps]);

  useEffect(() => {
    // Phase 1: Animate pre-fetch steps immediately
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));
    }, 30);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Show pre-fetch steps (0, 1, 2) immediately on their schedule
    for (let i = 0; i < PRE_FETCH_STEPS.length; i++) {
      timers.push(
        setTimeout(() => setVisibleSteps(i + 1), cumulativeDelays[i]),
      );
    }

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [cumulativeDelays, totalDuration]);

  // Phase 2: When estimate data arrives, reveal remaining steps
  useEffect(() => {
    if (!estimate || completedRef.current) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Ensure we're past the pre-fetch steps before showing data-dependent steps
    const preFetchEnd = cumulativeDelays[PRE_FETCH_STEPS.length - 1] +
      (PRE_FETCH_STEPS[PRE_FETCH_STEPS.length - 1].type === 'stat' ? STAT_DELAY : ACTION_DELAY);
    const now = performance.now();
    const baseDelay = Math.max(0, preFetchEnd - now + 100);

    for (let i = PRE_FETCH_STEPS.length; i < allSteps.length; i++) {
      const stepOffset = cumulativeDelays[i] - cumulativeDelays[PRE_FETCH_STEPS.length];
      timers.push(
        setTimeout(
          () => setVisibleSteps(i + 1),
          baseDelay + stepOffset,
        ),
      );
    }

    // Complete after all steps
    const lastStepDelay = baseDelay +
      (cumulativeDelays[allSteps.length - 1] - cumulativeDelays[PRE_FETCH_STEPS.length]) +
      (allSteps[allSteps.length - 1].type === 'stat' ? STAT_DELAY : ACTION_DELAY) +
      COMPLETE_PADDING;

    timers.push(
      setTimeout(() => {
        completedRef.current = true;
        setProgress(100);
        onComplete();
      }, lastStepDelay),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [estimate, allSteps, cumulativeDelays, onComplete]);

  const steps = allSteps.slice(0, visibleSteps);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="py-6"
    >
      {/* Progress bar */}
      <div className="w-full h-3 bg-foundry-dark/10 border-[2px] border-foundry-dark mb-6">
        <div
          className="h-full bg-foundry-yellow transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2 font-mono text-sm">
        {steps.map((step, i) => (
          <motion.div
            key={`${i}-${step.text}`}
            initial={step.type === 'stat' ? { opacity: 0, y: -4 } : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={
              step.type === 'stat'
                ? { duration: 0.2, ease: 'easeOut' }
                : { duration: 0.15 }
            }
            className={`flex items-center gap-3 ${step.type === 'stat' ? 'pl-8' : ''}`}
          >
            {step.type === 'action' && (
              <span className="text-foundry-yellow font-bold">{'>'}</span>
            )}
            <span
              className={
                step.type === 'stat'
                  ? i === visibleSteps - 1
                    ? 'text-foundry-dark/60 text-xs tracking-wide'
                    : 'text-foundry-dark/35 text-xs tracking-wide'
                  : i === visibleSteps - 1
                    ? 'text-foundry-dark font-bold'
                    : 'text-foundry-dark/50'
              }
            >
              {step.text}
            </span>
            {i < visibleSteps - 1 && step.type === 'action' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                className="text-green-600 font-bold ml-auto"
              >
                DONE
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
