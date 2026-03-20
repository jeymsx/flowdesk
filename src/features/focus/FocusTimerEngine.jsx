import { useEffect } from 'react';
import { useFocusStore } from '../../store/focusStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { useUIStore } from '../../store/uiStore';

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function playCompletionSound(toBreak) {
  try {
    const ctx = new (window.AudioContext || window['webkitAudioContext'])();
    const notes = toBreak
      ? [{ f: 523, t: 0 }, { f: 659, t: 0.18 }, { f: 784, t: 0.36 }]
      : [{ f: 784, t: 0 }, { f: 659, t: 0.18 }, { f: 523, t: 0.36 }];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = f;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.45);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.5);
    });
  } catch {}
}

// Always mounted at app root — owns the timer interval and all side effects.
export default function FocusTimerEngine() {
  const running = useFocusStore((s) => s.running);
  const isBreak = useFocusStore((s) => s.isBreak);
  const timeLeft = useFocusStore((s) => s.timeLeft);
  const flash = useFocusStore((s) => s.flash);
  const tick = useFocusStore((s) => s.tick);
  const clearFlash = useFocusStore((s) => s.clearFlash);
  const addFocusSession = useGamificationStore((s) => s.addFocusSession);
  const setFocusRunning = useUIStore((s) => s.setFocusRunning);

  // Sync running state to global UI store (e.g. sidebar indicators)
  useEffect(() => { setFocusRunning(running); }, [running, setFocusRunning]);

  // Tab title countdown
  useEffect(() => {
    if (running) {
      document.title = `${formatTime(timeLeft)} · ${isBreak ? 'Break' : 'Focus'} — FlowDesk`;
    } else {
      document.title = 'FlowDesk';
    }
    return () => { document.title = 'FlowDesk'; };
  }, [running, timeLeft, isBreak]);

  // Auto-clear flash after 2 s
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(clearFlash, 2000);
    return () => clearTimeout(id);
  }, [flash, clearFlash]);

  // The interval — restarts whenever running toggles
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const event = tick();
      if (event === 'focus_complete') {
        playCompletionSound(true);
        addFocusSession();
      } else if (event === 'break_complete') {
        playCompletionSound(false);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, tick, addFocusSession]);

  return null;
}
