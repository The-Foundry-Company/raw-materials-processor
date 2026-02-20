import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  'READING INPUT DATA...',
  'DEDUPLICATING RESULT ITEMS...',
  'CLASSIFYING MATERIALS...',
  'CONSOLIDATING VARIANTS...',
  'GENERATING OUTPUT...',
];

const STEP_DELAY = 600; // ms per step

interface Props {
  onComplete: () => void;
}

export default function ProcessingStage({ onComplete }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = STEPS.length * STEP_DELAY;

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);
    }, 30);

    // Step reveals
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < STEPS.length; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleSteps(i + 1);
        }, STEP_DELAY * i)
      );
    }

    // Complete
    timers.push(
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        onComplete();
      }, totalDuration)
    );

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

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
      <div className="space-y-3 font-mono text-sm">
        {STEPS.slice(0, visibleSteps).map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3"
          >
            <span className="text-foundry-yellow font-bold">{'>'}</span>
            <span className={i < visibleSteps - 1 ? 'text-foundry-dark/50' : 'text-foundry-dark font-bold'}>
              {step}
            </span>
            {i < visibleSteps - 1 && (
              <span className="text-green-600 font-bold ml-auto">DONE</span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
