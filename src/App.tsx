import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, cancelFrame, frame } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import Header from './components/Header';
import InputStage from './components/InputStage';
import ProcessingStage from './components/ProcessingStage';
import OutputStage from './components/OutputStage';
import EstimateProcessingStage from './components/EstimateProcessingStage';
import type { ProcessedItem, ProjectEstimate } from './processor/types';

type Stage = 'input' | 'processing' | 'output' | 'estimateProcessing';

const FORMAT_ERROR_MESSAGES = [
  "That JSON is valid, but it's not a materials list.",
  "Nice JSON. Wrong format. We need Litematica output.",
  "JSON's fine — but we don't know what to do with it.",
  "That's JSON alright, just not the JSON we're looking for.",
];

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function App() {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  const [stage, setStage] = useState<Stage>('input');
  const [result, setResult] = useState<ProcessedItem[]>([]);
  const [error, setError] = useState('');
  const [rawJson, setRawJson] = useState('');
  const [projectEstimate, setProjectEstimate] = useState<ProjectEstimate | null>(null);

  function handleSubmit(json: string) {
    setRawJson(json);
    setError('');
    setStage('processing');
  }

  const handleProcessingComplete = useCallback((processed: ProcessedItem[]) => {
    setResult(processed);
    setStage('output');
  }, []);

  const handleProcessingError = useCallback((_message: string) => {
    setError(pickRandom(FORMAT_ERROR_MESSAGES));
    setStage('input');
  }, []);

  const handleGenerateEstimate = useCallback(() => {
    setProjectEstimate(null);
    setStage('estimateProcessing');
  }, []);

  const handleEstimateComplete = useCallback((project: ProjectEstimate) => {
    setProjectEstimate(project);
    setStage('output');
  }, []);

  const handleEstimateError = useCallback((message: string) => {
    setError(message);
    setStage('output');
  }, []);

  function handleReset() {
    setStage('input');
    setResult([]);
    setRawJson('');
    setError('');
    setProjectEstimate(null);
  }

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
    <div className="min-h-screen bg-[#f5f5f0] px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <Header />

        <AnimatePresence>
          {error && stage === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.8 }}
              className="border-[3px] border-red-500 bg-red-50 px-4 py-3 mb-4"
            >
              <span className="text-red-500 font-mono font-bold text-lg">!! </span>
              <p className="text-red-600 font-bold text-sm inline">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <InputStage key="input" onSubmit={handleSubmit} />
          )}
          {stage === 'processing' && (
            <ProcessingStage key="processing" rawJson={rawJson} onComplete={handleProcessingComplete} onError={handleProcessingError} />
          )}
          {stage === 'estimateProcessing' && (
            <EstimateProcessingStage
              key="estimateProcessing"
              items={result}
              onComplete={handleEstimateComplete}
              onError={handleEstimateError}
            />
          )}
          {stage === 'output' && (
            <OutputStage
              key="output"
              items={result}
              projectEstimate={projectEstimate}
              onGenerateEstimate={handleGenerateEstimate}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
    </ReactLenis>
  );
}
