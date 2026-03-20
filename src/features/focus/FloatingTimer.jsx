import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useFocusStore, BUILTIN_PRESETS } from '../../store/focusStore';
import { useUIStore } from '../../store/uiStore';

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Shared mini timer UI (renders in both PiP window and draggable overlay) ────
export function MiniTimerContent({ onClose }) {
  const timeLeft      = useFocusStore((s) => s.timeLeft);
  const isBreak       = useFocusStore((s) => s.isBreak);
  const running       = useFocusStore((s) => s.running);
  const sessions      = useFocusStore((s) => s.sessions);
  const flash         = useFocusStore((s) => s.flash);
  const preset        = useFocusStore((s) => s.preset);
  const customWork    = useFocusStore((s) => s.customWork);
  const customBreak   = useFocusStore((s) => s.customBreak);
  const togglePlay    = useFocusStore((s) => s.togglePlay);
  const reset         = useFocusStore((s) => s.reset);

  const wt = preset === 'custom' ? customWork * 60 : BUILTIN_PRESETS[preset].work;
  const bt = preset === 'custom' ? customBreak * 60 : BUILTIN_PRESETS[preset].break;
  const total = isBreak ? bt : wt;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
  const circumference = 2 * Math.PI * 30;

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col p-3 gap-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${isBreak ? 'text-emerald-500' : 'text-accent-500'}`}>
          {isBreak ? 'Break' : 'Focus'}
        </span>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress ring */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="4"
              className="text-gray-100 dark:text-gray-800" />
            <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className={isBreak ? 'text-emerald-400' : 'text-accent-500'}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[17px] font-bold tabular-nums leading-none">{formatTime(timeLeft)}</span>
            {sessions > 0 && (
              <span className="text-[9px] text-gray-400 dark:text-gray-500">{sessions}× today</span>
            )}
          </div>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <p className={`text-[10px] font-semibold text-center leading-none shrink-0 ${flash === 'break' ? 'text-emerald-500' : 'text-accent-500'}`}>
          {flash === 'break' ? '✓ Break time!' : 'Back to focus!'}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 shrink-0">
        <button
          onClick={reset}
          title="Reset"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 ${
            isBreak
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
              : 'bg-accent-500 hover:bg-accent-600 shadow-accent-500/25'
          }`}
        >
          {running
            ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
            : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          }
        </button>

        {/* Spacer to balance the reset button */}
        <div className="w-8 h-8" />
      </div>
    </div>
  );
}

// ── Draggable overlay (mobile / Safari / Firefox fallback) ────────────────────
function DraggableMiniTimer({ onClose }) {
  const [pos, setPos] = useState({ x: window.innerWidth - 240, y: 80 });
  const dragRef = useRef(null);

  useEffect(() => {
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const { clientX, clientY } = ev.touches ? ev.touches[0] : ev;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 224, clientX - dragRef.current.sx)),
        y: Math.max(0, Math.min(window.innerHeight - 210, clientY - dragRef.current.sy)),
      });
    };
    const onUp = () => { dragRef.current = null; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const startDrag = (clientX, clientY) => {
    dragRef.current = { sx: clientX - pos.x, sy: clientY - pos.y };
  };

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, width: 224, height: 210 }}
      className="rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => { if (!e.target.closest('button')) { e.preventDefault(); startDrag(e.clientX, e.clientY); } }}
      onTouchStart={(e) => { if (!e.target.closest('button')) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
    >
      <MiniTimerContent onClose={onClose} />
    </div>
  );
}

// ── PiP helpers ───────────────────────────────────────────────────────────────
const PIP_W = 240;
const PIP_H = 220;

function copyStyles(targetWin) {
  [...document.querySelectorAll('link[rel="stylesheet"]')].forEach((link) => {
    const el = targetWin.document.createElement('link');
    el.rel = 'stylesheet';
    el.href = link.href;
    targetWin.document.head.appendChild(el);
  });
  [...document.querySelectorAll('style')].forEach((style) => {
    const el = targetWin.document.createElement('style');
    el.textContent = style.textContent;
    targetWin.document.head.appendChild(el);
  });
}

function applyDark(targetWin, isDark) {
  targetWin.document.documentElement.classList.toggle('dark', isDark);
  targetWin.document.body.style.backgroundColor = isDark ? '#111827' : '#ffffff';
}

// ── Root component — always mounted in AppLayout ──────────────────────────────
export default function FloatingTimer() {
  const isPopped   = useFocusStore((s) => s.isPopped);
  const setPopped  = useFocusStore((s) => s.setPopped);
  const darkMode   = useUIStore((s) => s.darkMode);

  const supportsPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const isMobile    = typeof window !== 'undefined' && window.innerWidth < 768;
  const usePiP      = supportsPiP && !isMobile;

  const pipWinRef  = useRef(null);
  const pipRootRef = useRef(null);

  const closePiP = useCallback(() => {
    if (pipRootRef.current) { pipRootRef.current.unmount(); pipRootRef.current = null; }
    if (pipWinRef.current && !pipWinRef.current.closed) { pipWinRef.current.close(); }
    pipWinRef.current = null;
  }, []);

  // Sync dark mode class into the PiP window whenever it changes
  useEffect(() => {
    if (pipWinRef.current && !pipWinRef.current.closed) {
      applyDark(pipWinRef.current, darkMode);
    }
  }, [darkMode]);

  // Open / close PiP
  useEffect(() => {
    if (!isPopped) {
      closePiP();
      return;
    }
    if (!usePiP) return; // draggable overlay handled below

    let cancelled = false;

    (async () => {
      try {
        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: PIP_W,
          height: PIP_H,
        });
        if (cancelled) { pipWin.close(); return; }

        pipWinRef.current = pipWin;
        copyStyles(pipWin);
        applyDark(pipWin, useUIStore.getState().darkMode);
        pipWin.document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;';

        const container = pipWin.document.createElement('div');
        container.style.cssText = `width:${PIP_W}px;height:${PIP_H}px;`;
        pipWin.document.body.appendChild(container);

        const root = createRoot(container);
        pipRootRef.current = root;

        root.render(
          <MiniTimerContent
            onClose={() => { closePiP(); setPopped(false); }}
          />
        );

        // User closed the PiP window via the OS chrome
        const onPageHide = () => {
          if (pipRootRef.current) { pipRootRef.current.unmount(); pipRootRef.current = null; }
          pipWinRef.current = null;
          setPopped(false);
        };
        pipWin.addEventListener('pagehide', onPageHide);
      } catch (err) {
        // Denied or unsupported at runtime — close the pop-out
        console.warn('Document PiP unavailable:', err);
        if (!cancelled) setPopped(false);
      }
    })();

    return () => {
      cancelled = true;
      // If the window is still open when the effect re-runs (e.g. deps changed),
      // remove the pagehide listener so it doesn't fire after cleanup.
      if (pipWinRef.current && !pipWinRef.current.closed) {
        closePiP();
      }
    };
  }, [isPopped, usePiP, closePiP, setPopped]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => closePiP, [closePiP]);

  // Draggable fallback for mobile / Safari / Firefox (or if PiP was denied at runtime)
  if (!isPopped || usePiP) return null;

  return createPortal(
    <DraggableMiniTimer onClose={() => setPopped(false)} />,
    document.body
  );
}
