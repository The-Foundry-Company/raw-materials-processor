import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onSubmit: (json: string) => void;
}

const EMPTY_INPUT_MESSAGES = [
  "Paste your raw materials JSON first.",
  "The textarea is emptier than a stripped chunk.",
  "You forgot the JSON. It's kind of the whole point.",
  "Nothing to process. Not even air blocks.",
];

const INVALID_JSON_MESSAGES = [
  "Invalid JSON. Check your syntax and try again.",
  "That's not JSON. That's a creeper's diary entry.",
  "JSON.parse() tried its best. It wasn't enough.",
  "This JSON is more broken than a wooden pickaxe on obsidian.",
  "Even Redstone engineers write better JSON than this.",
  "Your brackets are having an existential crisis.",
  "That's not valid JSON — did a skeleton shoot your closing brace?",
  "Somewhere, a JSON validator just cried.",
  "This looks like enchantment table language, not JSON.",
];

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function InputStage({ onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  function handleSubmit() {
    if (!value.trim()) {
      setError(pickRandom(EMPTY_INPUT_MESSAGES));
      setShakeKey((k) => k + 1);
      return;
    }
    try {
      JSON.parse(value);
      setError('');
      onSubmit(value);
    } catch {
      setError(pickRandom(INVALID_JSON_MESSAGES));
      setShakeKey((k) => k + 1);
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
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <textarea
          className={`w-full h-72 sm:h-96 p-4 font-mono text-sm bg-white text-foundry-dark
            border-[3px] resize-none outline-none
            placeholder:text-foundry-dark/30
            ${error ? 'border-red-500 animate-border-pulse' : 'border-foundry-dark'}
            focus:border-foundry-yellow transition-colors`}
          placeholder="Paste your raw materials JSON here..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          spellCheck={false}
        />
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.8 }}
            className="mt-3 border-[3px] border-red-500 bg-red-50 px-4 py-3"
          >
            <span className="text-red-500 font-mono font-bold text-lg">!! </span>
            <p className="text-red-600 font-bold text-sm inline">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
