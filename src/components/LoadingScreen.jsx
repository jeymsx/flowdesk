import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHRASES = [
  'Brewing productivity… ☕',
  'Charging up your XP… ⚡',
  'Waking up the widgets… 🧩',
  'Getting your workspace ready… 🚀',
  'Warming up the focus ring… 🎯',
  'Almost there… ✨',
];

const LogoIcon = () => (
  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export default function LoadingScreen() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % PHRASES.length), 1400);
    return () => clearInterval(id);
  }, []);

  // Arc spinner constants
  const r = 44;
  const circ = 2 * Math.PI * r;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col items-center justify-center z-50 gap-8">
      {/* Ambient glow */}
      <motion.div
        className="absolute w-[480px] h-[480px] rounded-full bg-accent-500/12 dark:bg-accent-500/10 blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.14, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Logo + spinning ring */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Track ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={r} fill="none" stroke="currentColor" strokeWidth={3.5}
            className="text-gray-100 dark:text-gray-800" />
        </svg>

        {/* Spinning arc */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          style={{ rotate: -90 }}
          animate={{ rotate: ['-90deg', '270deg'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={50} cy={50} r={r}
            fill="none" stroke="currentColor" strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.28} ${circ * 0.72}`}
            className="text-accent-500"
          />
        </motion.svg>

        {/* Logo icon */}
        <motion.div
          className="w-12 h-12 bg-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/30 z-10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <LogoIcon />
        </motion.div>
      </div>

      {/* Cycling phrase */}
      <div className="h-7 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            className="text-sm text-gray-400 dark:text-gray-500 font-medium tracking-wide"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {PHRASES[phraseIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
