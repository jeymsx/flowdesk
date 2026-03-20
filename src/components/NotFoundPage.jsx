import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Floating widget cards in the background
const FLOATERS = [
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Calendar',     x: '-left-4',  y: 'top-20',    delay: 0,    rotate: -8  },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',                                            label: 'Focus',        x: '-right-2', y: 'top-32',    delay: 0.15, rotate: 6   },
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Tasks', x: '-left-2',  y: 'bottom-28', delay: 0.3,  rotate: 5   },
  { icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',                                      label: 'Bookmarks',    x: '-right-4', y: 'bottom-20', delay: 0.45, rotate: -6  },
  { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Notes', x: 'left-1/3', y: '-top-6', delay: 0.6, rotate: -4 },
];

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6 text-center transition-colors overflow-hidden">

      {/* Subtle radial glow behind the content */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div className="w-[600px] h-[600px] rounded-full bg-accent-500/10 dark:bg-accent-500/8 blur-3xl" />
      </div>

      {/* Floating widget cards */}
      <div className="pointer-events-none absolute inset-0 max-w-2xl mx-auto" aria-hidden>
        {FLOATERS.map(({ icon, label, x, y, delay, rotate }) => (
          <motion.div
            key={label}
            className={`absolute ${x} ${y}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
              style={{ rotate }}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}</span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* 404 number */}
        <motion.p
          className="text-[120px] sm:text-[160px] font-black leading-none select-none tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-accent-400 to-accent-600"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          404
        </motion.p>

        {/* Heading */}
        <motion.h1
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          You went off-schedule
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm mb-10 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          This page doesn't exist — but your dashboard is right where you left it.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-accent-500/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to home
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-2xl transition-colors"
          >
            <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Try the demo
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
