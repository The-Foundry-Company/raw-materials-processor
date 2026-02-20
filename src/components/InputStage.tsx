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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setValue(content);
        if (error) setError('');
      };
      reader.readAsText(file);
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

      <div className="flex gap-3 mt-4">
        <label
          className="py-3 px-5 bg-foundry-dark text-foundry-yellow
            font-bold text-sm tracking-wider border-[3px] border-foundry-dark
            cursor-pointer select-none
            hover:bg-foundry-yellow hover:text-foundry-dark
            active:scale-[0.98] transition-none
            hover:transition-none"
        >
          UPLOAD JSON
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        <button
          onClick={handleSubmit}
          className="flex-1 py-3 bg-foundry-yellow text-foundry-dark
            font-black text-lg tracking-wider border-[3px] border-foundry-dark
            hover:bg-foundry-dark hover:text-foundry-yellow
            active:scale-[0.98] transition-none
            hover:transition-none"
        >
          PROCESS
        </button>
      </div>
    </motion.div>
  );
}
