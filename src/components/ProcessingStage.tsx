import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { process, validateInput } from '../processor';
import { stripNamespace, isFunctional, resolveVariant, GENERIC_WOOD_ITEMS } from '../processor/rules';
import type { RawInput, ProcessedItem } from '../processor/types';

// ── Step types ──

interface Step {
  text: string;
  type: 'action' | 'stat';
}

// ── Timing ──

const ACTION_DELAY = 500;
const STAT_DELAY = 250;
const COMPLETE_PADDING = 400;

// ── Fallback steps (if processing fails before animation) ──

const FALLBACK_STEPS: Step[] = [
  { text: 'READING INPUT DATA...', type: 'action' },
  { text: 'DEDUPLICATING RESULT ITEMS...', type: 'action' },
  { text: 'CLASSIFYING MATERIALS...', type: 'action' },
  { text: 'DECOMPOSING STRIPPED WOOD...', type: 'action' },
  { text: 'CONSOLIDATING VARIANTS...', type: 'action' },
  { text: 'VERIFYING OUTPUT INTEGRITY...', type: 'action' },
  { text: 'GENERATING OUTPUT...', type: 'action' },
];

// ── Process data and build dynamic step list ──

interface ProcessingResult {
  steps: Step[];
  result: ProcessedItem[];
}

function processAndBuildSteps(rawJson: string): ProcessingResult | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (!validateInput(parsed)) return null;
    const input = parsed as RawInput;
    const result = process(input);

    // Gather stats for dynamic steps
    const uniqueItems = new Set<string>();
    for (const group of input) {
      for (const r of group.Results) {
        uniqueItems.add(r.ResultItem);
      }
    }

    let strippedCount = 0;
    let functionalCount = 0;
    let variantCount = 0;
    let genericWoodCount = 0;
    for (const item of uniqueItems) {
      const name = stripNamespace(item);
      if (name.startsWith('stripped_') && resolveVariant(name)) {
        strippedCount++;
      } else if (isFunctional(name)) {
        functionalCount++;
      } else if (name in GENERIC_WOOD_ITEMS) {
        genericWoodCount++;
      } else if (resolveVariant(name)) {
        variantCount++;
      }
    }

    // Build step list with dynamic stats interspersed
    const steps: Step[] = [
      { text: 'READING INPUT DATA...', type: 'action' },
      { text: `${input.length} RAW MATERIAL GROUPS LOADED`, type: 'stat' },
      { text: 'DEDUPLICATING RESULT ITEMS...', type: 'action' },
      { text: `${uniqueItems.size} UNIQUE ITEMS IDENTIFIED`, type: 'stat' },
      { text: 'CLASSIFYING MATERIALS...', type: 'action' },
    ];

    // Classification breakdown
    const parts: string[] = [];
    if (functionalCount > 0) parts.push(`${functionalCount} FUNCTIONAL`);
    if (variantCount > 0) parts.push(`${variantCount} VARIANTS`);
    if (strippedCount > 0) parts.push(`${strippedCount} STRIPPED`);
    if (parts.length > 0) {
      steps.push({ text: parts.join(' \u00B7 '), type: 'stat' });
    }

    if (strippedCount > 0) {
      steps.push({ text: 'DECOMPOSING STRIPPED WOOD...', type: 'action' });
      steps.push({ text: `${strippedCount} STRIPPED ITEMS \u2192 BASE FORM`, type: 'stat' });
    }

    steps.push({ text: 'CONSOLIDATING VARIANTS...', type: 'action' });
    steps.push({ text: 'RESOLVING DECOMPOSITION CHAINS...', type: 'action' });

    if (genericWoodCount > 0) {
      steps.push({ text: 'RESOLVING GENERIC WOOD ITEMS...', type: 'action' });
      steps.push({ text: `${genericWoodCount} GENERIC WOOD ITEMS \u2192 LOGS`, type: 'stat' });
    }

    steps.push({ text: 'VERIFYING OUTPUT INTEGRITY...', type: 'action' });
    steps.push({ text: 'GENERATING OUTPUT...', type: 'action' });
    steps.push({ text: `${result.length} UNIQUE MATERIALS IN FINAL OUTPUT`, type: 'stat' });

    return { steps, result };
  } catch {
    return null;
  }
}

// ── Component ──

interface Props {
  rawJson: string;
  onComplete: (result: ProcessedItem[]) => void;
  onError: (message: string) => void;
}

export default function ProcessingStage({ rawJson, onComplete, onError }: Props) {
  const processed = useMemo(() => processAndBuildSteps(rawJson), [rawJson]);
  const steps = processed?.steps ?? FALLBACK_STEPS;

  const [visibleSteps, setVisibleSteps] = useState(0);
  const [progress, setProgress] = useState(0);

  // Compute cumulative delays (actions take longer, stats appear quickly)
  const { cumulativeDelays, totalDuration } = useMemo(() => {
    const delays = [0];
    for (let i = 1; i < steps.length; i++) {
      const prevDelay = steps[i - 1].type === 'stat' ? STAT_DELAY : ACTION_DELAY;
      delays.push(delays[i - 1] + prevDelay);
    }
    const lastDelay = steps[steps.length - 1].type === 'stat' ? STAT_DELAY : ACTION_DELAY;
    const total = delays[delays.length - 1] + lastDelay + COMPLETE_PADDING;
    return { cumulativeDelays: delays, totalDuration: total };
  }, [steps]);

  useEffect(() => {
    if (!processed) {
      const t = setTimeout(
        () => onError('Invalid format. Expected an array of RawItem groups with Results.'),
        0,
      );
      return () => clearTimeout(t);
    }

    // Progress bar
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));
    }, 30);

    // Step reveals at cumulative delays
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < steps.length; i++) {
      timers.push(
        setTimeout(() => setVisibleSteps(i + 1), cumulativeDelays[i]),
      );
    }

    // Complete after all steps + padding
    timers.push(
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        onComplete(processed.result);
      }, totalDuration),
    );

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [onComplete, onError, processed, steps, cumulativeDelays, totalDuration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="py-8"
    >
      {/* Progress bar */}
      <div className="w-full h-3 bg-foundry-dark/10 border-[2px] border-foundry-dark mb-8">
        <div
          className="h-full bg-foundry-yellow transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2 font-mono text-sm">
        {steps.slice(0, visibleSteps).map((step, i) => (
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
