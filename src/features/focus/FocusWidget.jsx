import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../store/uiStore';

const BUILTIN_PRESETS = {
  pomodoro: { work: 25 * 60, break: 5 * 60, label: '25/5' },
  long: { work: 50 * 60, break: 10 * 60, label: '50/10' },
  short: { work: 15 * 60, break: 3 * 60, label: '15/3' },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Draggable mini-timer portal ───────────────────────────────────────────────
function MiniTimer({ timeLeft, running, isBreak, progress, onToggle, onReset, onClose }) {
  const [pos, setPos] = useState({ x: window.innerWidth - 220, y: 80 });
  const dragRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX - pos.x, startY: e.clientY - pos.y };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, ev.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 160, ev.clientY - dragRef.current.startY)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const circumference = 2 * Math.PI * 30;

  return createPortal(
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 w-48 select-none"
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing">
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {isBreak ? 'Break' : 'Focus'}
        </span>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-center mb-2.5">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
            <circle
              cx="40" cy="40" r="30" fill="none"
              stroke="currentColor" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className={isBreak ? 'text-emerald-400' : 'text-accent-500'}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={onToggle}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-accent-500 hover:bg-accent-600 text-white transition-colors"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={onReset}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Reset"
        >
          ↺
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function FocusWidget() {
  const [preset, setPreset] = useState('pomodoro');
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isPopped, setIsPopped] = useState(false);
  const intervalRef = useRef(null);
  const setFocusRunning = useUIStore((s) => s.setFocusRunning);

  useEffect(() => {
    setFocusRunning(running);
  }, [running, setFocusRunning]);

  const workTime = preset === 'custom' ? customWork * 60 : BUILTIN_PRESETS[preset].work;
  const breakTime = preset === 'custom' ? customBreak * 60 : BUILTIN_PRESETS[preset].break;
  const total = isBreak ? breakTime : workTime;

  const [timeLeft, setTimeLeft] = useState(workTime);

  const workTimeRef = useRef(workTime);
  const breakTimeRef = useRef(breakTime);
  useEffect(() => { workTimeRef.current = workTime; }, [workTime]);
  useEffect(() => { breakTimeRef.current = breakTime; }, [breakTime]);

  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setRunning(false);
        if (!isBreak) {
          setSessions((s) => s + 1);
          setIsBreak(true);
          return breakTimeRef.current;
        } else {
          setIsBreak(false);
          return workTimeRef.current;
        }
      }
      return prev - 1;
    });
  }, [isBreak]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  const handlePresetChange = (key) => {
    setPreset(key);
    setRunning(false);
    setIsBreak(false);
    if (key !== 'custom') {
      setTimeLeft(BUILTIN_PRESETS[key].work);
    } else {
      setTimeLeft(customWork * 60);
    }
  };

  const reset = () => {
    setRunning(false);
    setIsBreak(false);
    setTimeLeft(isBreak ? breakTime : workTime);
  };

  const togglePlay = () => setRunning((r) => !r);

  const circumference = 2 * Math.PI * 54;

  // Responsive ring size based on available space
  const timerSectionRef = useRef(null);
  const [ringSize, setRingSize] = useState(128);
  useEffect(() => {
    const el = timerSectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const size = Math.min(Math.max(Math.min(width * 0.75, height * 0.75), 128), 240);
      setRingSize(size);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const timeFontSize = Math.round(Math.max(16, ringSize * 0.21));
  const labelFontSize = Math.round(Math.max(10, ringSize * 0.1));

  return (
    <>
      {isPopped && (
        <MiniTimer
          timeLeft={timeLeft}
          running={running}
          isBreak={isBreak}
          progress={progress}
          onToggle={togglePlay}
          onReset={reset}
          onClose={() => setIsPopped(false)}
        />
      )}

      <div className="h-full flex flex-col p-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Focus Timer
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{sessions} sessions</span>
            <button
              onClick={() => setIsPopped((p) => !p)}
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
              onClick={() => handlePresetChange(key)}
              className={`flex-1 py-1 px-1 text-[11px] rounded font-medium transition-colors ${
                preset === key
                  ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {val.label}
            </button>
          ))}
          <button
            onClick={() => handlePresetChange('custom')}
            className={`flex-1 py-1 px-1 text-[11px] rounded font-medium transition-colors ${
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
                type="number"
                min={1}
                max={120}
                value={customWork}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(120, Number(e.target.value)));
                  setCustomWork(v);
                  if (!running && !isBreak) setTimeLeft(v * 60);
                }}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Break (min)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={customBreak}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(60, Number(e.target.value)));
                  setCustomBreak(v);
                  if (!running && isBreak) setTimeLeft(v * 60);
                }}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        )}

        {/* Timer ring + controls */}
        <div ref={timerSectionRef} className={`flex flex-col items-center justify-center py-2 min-h-[180px] ${preset !== 'custom' ? 'flex-1 min-h-0' : ''}`}>
          <div className="relative mb-4 shrink-0" style={{ width: ringSize, height: ringSize }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
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
              <span style={{ fontSize: timeFontSize }} className="font-bold text-gray-900 dark:text-white tabular-nums leading-none">{formatTime(timeLeft)}</span>
              <span style={{ fontSize: labelFontSize }} className="text-gray-500 dark:text-gray-400 mt-1">{isBreak ? 'Break' : 'Focus'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={togglePlay}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
                running
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'bg-accent-500 text-white hover:bg-accent-600'
              }`}
            >
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
