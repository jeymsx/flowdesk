import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusStore, BUILTIN_PRESETS } from '../../store/focusStore';
import { useUIStore } from '../../store/uiStore';

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Fullscreen timer overlay ───────────────────────────────────────────────
function FullscreenTimerOverlay({ onClose }) {
  const timeLeft     = useFocusStore((s) => s.timeLeft);
  const isBreak      = useFocusStore((s) => s.isBreak);
  const running      = useFocusStore((s) => s.running);
  const sessions     = useFocusStore((s) => s.sessions);
  const preset       = useFocusStore((s) => s.preset);
  const customWork   = useFocusStore((s) => s.customWork);
  const customBreak  = useFocusStore((s) => s.customBreak);
  const flash        = useFocusStore((s) => s.flash);
  const togglePlay   = useFocusStore((s) => s.togglePlay);
  const reset        = useFocusStore((s) => s.reset);
  const skip         = useFocusStore((s) => s.skip);
  const darkMode     = useUIStore((s) => s.darkMode);

  const wt    = preset === 'custom' ? customWork * 60 : BUILTIN_PRESETS[preset].work;
  const bt    = preset === 'custom' ? customBreak * 60 : BUILTIN_PRESETS[preset].break;
  const total = isBreak ? bt : wt;
  const pct   = total > 0 ? (total - timeLeft) / total : 0;
  const r     = 54;
  const circ  = 2 * Math.PI * r;
  const label = isBreak ? 'Break' : (preset === 'custom' ? 'Custom' : BUILTIN_PRESETS[preset].label);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, togglePlay]);

  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center select-none overflow-hidden bg-white dark:bg-gray-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Ambient glow */}
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none ${
          isBreak ? 'dark:bg-emerald-500/12' : 'dark:bg-accent-500/12'
        }`}
        animate={{ scale: running ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 5, repeat: running ? Infinity : 0, ease: 'easeInOut' }}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/80 transition-colors"
        title="Exit fullscreen (ESC)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mode + sessions */}
      <div className="flex items-center gap-3 mb-10">
        <span className={`text-sm font-bold uppercase tracking-[0.18em] ${isBreak ? 'text-emerald-500 dark:text-emerald-400' : 'text-accent-500 dark:text-accent-400'}`}>
          {label}
        </span>
        {sessions > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
            <span className="text-sm text-gray-400 dark:text-white/30">{sessions} session{sessions !== 1 ? 's' : ''} today</span>
          </>
        )}
      </div>

      {/* Ring */}
      <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="5"
            className="text-gray-200 dark:text-white/15" />
          <circle
            cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            className={isBreak ? 'text-emerald-400' : 'text-accent-500'}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tabular-nums leading-none text-gray-900 dark:text-white tracking-tight">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.p
            className={`mt-6 text-sm font-semibold ${flash === 'break' ? 'text-emerald-500 dark:text-emerald-400' : 'text-accent-500 dark:text-accent-400'}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {flash === 'break' ? '✓ Session done — take a break!' : 'Break over — back to focus!'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-5 mt-10">
        <button
          onClick={reset}
          title="Reset"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className={`w-20 h-20 flex items-center justify-center rounded-full text-white shadow-2xl transition-all active:scale-95 ${
            isBreak
              ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25'
              : 'bg-accent-500 hover:bg-accent-400 shadow-accent-500/25'
          }`}
        >
          {running
            ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
            : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          }
        </button>

        <button
          onClick={skip}
          title={isBreak ? 'Skip break' : 'Skip to break'}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-8 flex items-center gap-3 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <span className="flex items-center gap-1.5">
          <kbd className="text-[11px] font-bold text-gray-700 dark:text-gray-200 font-mono">Space</kbd>
          <span className="text-[11px] text-gray-400 dark:text-gray-400">pause / play</span>
        </span>
        <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
        <span className="flex items-center gap-1.5">
          <kbd className="text-[11px] font-bold text-gray-700 dark:text-gray-200 font-mono">ESC</kbd>
          <span className="text-[11px] text-gray-400 dark:text-gray-400">exit fullscreen</span>
        </span>
      </div>
    </motion.div>
  );
}

function SessionDots({ sessions }) {
  const filled = sessions % 4;
  const cycle  = Math.floor(sessions / 4);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < filled ? 'bg-accent-500 scale-110' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      {cycle > 0 && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">×{cycle + 1}</span>
      )}
    </div>
  );
}

export default function FocusWidget() {
  // ── Store state ──────────────────────────────────────────────────────────────
  const preset       = useFocusStore((s) => s.preset);
  const customWork   = useFocusStore((s) => s.customWork);
  const customBreak  = useFocusStore((s) => s.customBreak);
  const isBreak      = useFocusStore((s) => s.isBreak);
  const running      = useFocusStore((s) => s.running);
  const sessions     = useFocusStore((s) => s.sessions);
  const timeLeft     = useFocusStore((s) => s.timeLeft);
  const autoContinue = useFocusStore((s) => s.autoContinue);
  const flash        = useFocusStore((s) => s.flash);
  const isPopped     = useFocusStore((s) => s.isPopped);

  const setPreset       = useFocusStore((s) => s.setPreset);
  const setCustomWork   = useFocusStore((s) => s.setCustomWork);
  const setCustomBreak  = useFocusStore((s) => s.setCustomBreak);
  const togglePlay      = useFocusStore((s) => s.togglePlay);
  const reset           = useFocusStore((s) => s.reset);
  const skip            = useFocusStore((s) => s.skip);
  const setAutoContinue = useFocusStore((s) => s.setAutoContinue);
  const setPopped       = useFocusStore((s) => s.setPopped);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const workTime = preset === 'custom' ? customWork * 60 : BUILTIN_PRESETS[preset].work;
  const breakTime = preset === 'custom' ? customBreak * 60 : BUILTIN_PRESETS[preset].break;
  const total = isBreak ? breakTime : workTime;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
  const circumference = 2 * Math.PI * 54;

  // ── Responsive ring — observe outer container ─────────────────────────────
  const containerRef = useRef(null);
  const [ringSize, setRingSize] = useState(160);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const overhead = preset === 'custom' ? 310 : 250;
      const availH = Math.max(height - overhead, 0);
      const size = Math.min(Math.max(Math.min(width * 0.65, availH), 140), 240);
      setRingSize(size);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [preset]);

  const timeFontSize  = Math.round(Math.max(18, ringSize * 0.21));
  const labelFontSize = Math.round(Math.max(11, ringSize * 0.1));

  return (
    <div ref={containerRef} className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Focus Timer
        </h3>
        <div className="flex items-center gap-1">
          {/* Auto-continue toggle */}
          <button
            onClick={() => setAutoContinue(!autoContinue)}
            title={autoContinue ? 'Auto-continue on' : 'Auto-continue off'}
            className={`p-1 rounded-lg transition-colors text-[10px] font-semibold px-1.5 ${
              autoContinue
                ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Auto break
          </button>
          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(true)}
            title="Fullscreen timer"
            className="p-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" />
            </svg>
          </button>
          {/* Pop-out */}
          <button
            onClick={() => setPopped(!isPopped)}
            title={isPopped ? 'Close pop-out' : 'Pop-out timer'}
            className={`p-1 rounded-lg transition-colors ${
              isPopped
                ? 'bg-accent-500/15 text-accent-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preset tabs */}
      <div className="grid grid-cols-4 gap-1 mb-3 shrink-0">
        {Object.entries(BUILTIN_PRESETS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`flex flex-col items-center py-1.5 px-0.5 rounded-lg font-medium transition-colors ${
              preset === key
                ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-[10px] font-semibold leading-tight">{val.label}</span>
            <span className={`text-[9px] leading-tight mt-0.5 ${preset === key ? 'text-accent-500/70 dark:text-accent-400/60' : 'text-gray-400 dark:text-gray-600'}`}>{val.sub}</span>
          </button>
        ))}
        <button
          onClick={() => setPreset('custom')}
          className={`flex flex-col items-center py-1.5 px-0.5 rounded-lg font-medium transition-colors ${
            preset === 'custom'
              ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-[10px] font-semibold leading-tight">Custom</span>
          <span className={`text-[9px] leading-tight mt-0.5 ${preset === 'custom' ? 'text-accent-500/70 dark:text-accent-400/60' : 'text-gray-400 dark:text-gray-600'}`}>Set own</span>
        </button>
      </div>

      {/* Custom duration inputs */}
      {preset === 'custom' && (
        <div className="flex gap-2 mb-3 shrink-0">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Focus (min)</label>
            <input
              type="number" min={1} max={120} value={customWork}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setCustomWork(Math.max(1, Math.min(120, isNaN(v) ? 1 : v))); }}
              className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Break (min)</label>
            <input
              type="number" min={1} max={60} value={customBreak}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setCustomBreak(Math.max(1, Math.min(60, isNaN(v) ? 1 : v))); }}
              className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>
      )}

      {/* Timer ring + controls */}
      <div className="flex flex-col items-center py-2 gap-3">
        {/* Ring */}
        <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6"
              className="text-gray-100 dark:text-gray-800" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="currentColor" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className={isBreak ? 'text-emerald-400' : 'text-accent-500'}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontSize: timeFontSize }} className="font-bold text-gray-900 dark:text-white tabular-nums leading-none">
              {formatTime(timeLeft)}
            </span>
            <span style={{ fontSize: labelFontSize }} className={`mt-1 font-semibold ${isBreak ? 'text-emerald-500' : 'text-accent-500'}`}>
              {isBreak ? 'Break' : (preset === 'custom' ? 'Custom' : BUILTIN_PRESETS[preset].label)}
            </span>
          </div>
        </div>

        {/* Phase flash */}
        {flash && (
          <p className={`text-[11px] font-semibold text-center leading-none ${flash === 'break' ? 'text-emerald-500' : 'text-accent-500'}`}>
            {flash === 'break' ? '✓ Session done — take a break!' : 'Break over — back to focus!'}
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={reset}
            title="Reset"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className={`w-14 h-14 flex items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 ${
              isBreak ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-accent-500 hover:bg-accent-600 shadow-accent-500/30'
            }`}
          >
            {running
              ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
              : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            }
          </button>

          <button
            onClick={skip}
            title={isBreak ? 'Skip break' : 'Skip to break'}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
            </svg>
          </button>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-3 shrink-0">
          <SessionDots sessions={sessions} />
          {sessions > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {sessions} session{sessions !== 1 ? 's' : ''} today
            </span>
          )}
        </div>
      </div>

      {/* Fullscreen overlay portal */}
      {createPortal(
        <AnimatePresence>
          {isFullscreen && (
            <FullscreenTimerOverlay onClose={() => setIsFullscreen(false)} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
