import { useEffect, useRef, useState } from 'react';
import { useFocusStore, BUILTIN_PRESETS } from '../../store/focusStore';

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
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
            Auto
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
      <div className="flex gap-1 mb-3 shrink-0">
        {Object.entries(BUILTIN_PRESETS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`flex-1 py-1 px-1 text-[11px] rounded-lg font-medium transition-colors ${
              preset === key
                ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {val.short}
          </button>
        ))}
        <button
          onClick={() => setPreset('custom')}
          className={`flex-1 py-1 px-1 text-[11px] rounded-lg font-medium transition-colors ${
            preset === 'custom'
              ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom duration inputs */}
      {preset === 'custom' && (
        <div className="flex gap-2 mb-3 shrink-0">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Focus (min)</label>
            <input
              type="number" min={1} max={120} value={customWork}
              onChange={(e) => setCustomWork(Math.max(1, Math.min(120, Number(e.target.value))))}
              className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Break (min)</label>
            <input
              type="number" min={1} max={60} value={customBreak}
              onChange={(e) => setCustomBreak(Math.max(1, Math.min(60, Number(e.target.value))))}
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
            <span style={{ fontSize: labelFontSize }} className={`mt-1 font-medium ${isBreak ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {isBreak ? 'Break' : 'Focus'}
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
    </div>
  );
}
