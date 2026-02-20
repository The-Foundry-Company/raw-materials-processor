import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onSubmit: (json: string) => void;
}

export default function InputStage({ onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!value.trim()) {
      setError('Paste your raw materials JSON first.');
      return;
    }
    try {
      JSON.parse(value);
      setError('');
      onSubmit(value);
    } catch {
      setError('Invalid JSON. Check your syntax and try again.');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
    >
      <textarea
        className={`w-full h-72 sm:h-96 p-4 font-mono text-sm bg-white text-foundry-dark
          border-[3px] resize-none outline-none
          placeholder:text-foundry-dark/30
          ${error ? 'border-red-500' : 'border-foundry-dark'}
          focus:border-foundry-yellow transition-colors`}
        placeholder="Paste your raw materials JSON here..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError('');
        }}
        spellCheck={false}
      />

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 font-bold text-sm mt-2"
        >
          {error}
        </motion.p>
      )}

      <button
        onClick={handleSubmit}
        className="w-full mt-4 py-3 bg-foundry-yellow text-foundry-dark
          font-black text-lg tracking-wider border-[3px] border-foundry-dark
          hover:bg-foundry-dark hover:text-foundry-yellow
          active:scale-[0.98] transition-none
          hover:transition-none"
      >
        PROCESS
      </button>
    </motion.div>
  );
}
