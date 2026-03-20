import { create } from 'zustand';

export const BUILTIN_PRESETS = {
  pomodoro: { work: 25 * 60, break: 5 * 60, short: '25/5' },
  long:     { work: 50 * 60, break: 10 * 60, short: '50/10' },
  short:    { work: 15 * 60, break: 3 * 60, short: '15/3' },
};

function calcWork(preset, customWork) {
  return preset === 'custom' ? customWork * 60 : BUILTIN_PRESETS[preset].work;
}
function calcBreak(preset, customBreak) {
  return preset === 'custom' ? customBreak * 60 : BUILTIN_PRESETS[preset].break;
}

export const useFocusStore = create((set, get) => ({
  preset: 'pomodoro',
  customWork: 25,
  customBreak: 5,
  isBreak: false,
  running: false,
  sessions: 0,
  timeLeft: 25 * 60,
  autoContinue: false,
  flash: null,      // 'focus' | 'break' | null
  isPopped: false,

  setPreset: (key) => {
    set({ preset: key, running: false, isBreak: false, timeLeft: calcWork(key, get().customWork) });
  },
  setCustomWork: (v) => {
    const { running, isBreak } = get();
    set({ customWork: v, ...(!running && !isBreak ? { timeLeft: v * 60 } : {}) });
  },
  setCustomBreak: (v) => {
    const { running, isBreak } = get();
    set({ customBreak: v, ...(!running && isBreak ? { timeLeft: v * 60 } : {}) });
  },
  togglePlay: () => set((s) => ({ running: !s.running })),
  reset: () => {
    const { preset, customWork } = get();
    set({ running: false, isBreak: false, timeLeft: calcWork(preset, customWork) });
  },
  skip: () => {
    const { isBreak: ib, preset, customWork: cw, customBreak: cb } = get();
    if (!ib) set({ running: false, isBreak: true, timeLeft: calcBreak(preset, cb) });
    else     set({ running: false, isBreak: false, timeLeft: calcWork(preset, cw) });
  },
  setAutoContinue: (v) => set({ autoContinue: v }),
  setPopped: (v) => set({ isPopped: v }),
  clearFlash: () => set({ flash: null }),

  // Returns an event string for side-effect handling in FocusTimerEngine
  tick: () => {
    const { timeLeft, isBreak, autoContinue, preset, customWork, customBreak } = get();
    if (timeLeft > 1) {
      set({ timeLeft: timeLeft - 1 });
      return null;
    }
    if (!isBreak) {
      set((s) => ({
        sessions: s.sessions + 1,
        isBreak: true,
        timeLeft: calcBreak(preset, customBreak),
        running: autoContinue,
        flash: 'break',
      }));
      return 'focus_complete';
    } else {
      set({ isBreak: false, timeLeft: calcWork(preset, customWork), running: autoContinue, flash: 'focus' });
      return 'break_complete';
    }
  },
}));
