import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import InputStage from './components/InputStage';
import ProcessingStage from './components/ProcessingStage';
import OutputStage from './components/OutputStage';
import type { ProcessedItem } from './processor/types';

type Stage = 'input' | 'processing' | 'output';

export default function App() {
  const [stage, setStage] = useState<Stage>('input');
  const [result, setResult] = useState<ProcessedItem[]>([]);
  const [error, setError] = useState('');
  const [rawJson, setRawJson] = useState('');

  function handleSubmit(json: string) {
    setRawJson(json);
    setStage('processing');
  }

  const handleProcessingComplete = useCallback((processed: ProcessedItem[]) => {
    setResult(processed);
    setStage('output');
  }, []);

  const handleProcessingError = useCallback((message: string) => {
    setError(message);
    setStage('input');
  }, []);

  function handleReset() {
    setStage('input');
    setResult([]);
    setRawJson('');
    setError('');
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <Header />

        {error && stage === 'input' && (
          <div className="border-[3px] border-red-500 bg-red-50 px-4 py-3 mb-4">
            <p className="text-red-600 font-bold text-sm">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <InputStage key="input" onSubmit={handleSubmit} />
          )}
          {stage === 'processing' && (
            <ProcessingStage key="processing" rawJson={rawJson} onComplete={handleProcessingComplete} onError={handleProcessingError} />
          )}
          {stage === 'output' && (
            <OutputStage key="output" items={result} onReset={handleReset} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
