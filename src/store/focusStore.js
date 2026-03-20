import { create } from 'zustand';

export const BUILTIN_PRESETS = {
  pomodoro: { work: 25 * 60, break: 5 * 60,  short: '25/5',  label: 'Sprint',    sub: '25 / 5 min'  },
  long:     { work: 50 * 60, break: 10 * 60, short: '50/10', label: 'Deep Work', sub: '50 / 10 min' },
  short:    { work: 15 * 60, break: 3 * 60,  short: '15/3',  label: 'Quick',     sub: '15 / 3 min'  },
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
  _startedAt: null,       // wall-clock ms when current phase started
  _startedTimeLeft: 0,    // timeLeft when the phase was (re)started

  setPreset: (key) => {
    set({ preset: key, running: false, isBreak: false, timeLeft: calcWork(key, get().customWork), _startedAt: null });
  },
  setCustomWork: (v) => {
    const { running, isBreak } = get();
    set({ customWork: v, ...(!running && !isBreak ? { timeLeft: v * 60 } : {}) });
  },
  setCustomBreak: (v) => {
    const { running, isBreak } = get();
    set({ customBreak: v, ...(!running && isBreak ? { timeLeft: v * 60 } : {}) });
  },
  togglePlay: () => set((s) => {
    if (s.running) return { running: false, _startedAt: null };
    return { running: true, _startedAt: Date.now(), _startedTimeLeft: s.timeLeft };
  }),
  reset: () => {
    const { preset, customWork } = get();
    set({ running: false, isBreak: false, timeLeft: calcWork(preset, customWork), _startedAt: null });
  },
  skip: () => {
    const { isBreak: ib, preset, customWork: cw, customBreak: cb } = get();
    if (!ib) set({ running: false, isBreak: true, timeLeft: calcBreak(preset, cb), _startedAt: null });
    else     set({ running: false, isBreak: false, timeLeft: calcWork(preset, cw), _startedAt: null });
  },
  setAutoContinue: (v) => set({ autoContinue: v }),
  setPopped: (v) => set({ isPopped: v }),
  clearFlash: () => set({ flash: null }),

  // Returns an event string for side-effect handling in FocusTimerEngine.
  // Uses wall-clock elapsed time so background-tab throttling doesn't cause drift.
  tick: () => {
    const { _startedAt, _startedTimeLeft, isBreak, autoContinue, preset, customWork, customBreak } = get();
    if (!_startedAt) return null;

    const elapsed = Math.floor((Date.now() - _startedAt) / 1000);
    const newTimeLeft = Math.max(0, _startedTimeLeft - elapsed);

    if (newTimeLeft > 0) {
      set({ timeLeft: newTimeLeft });
      return null;
    }

    // Phase complete
    if (!isBreak) {
      const bt = calcBreak(preset, customBreak);
      set((s) => ({
        sessions: s.sessions + 1,
        isBreak: true,
        timeLeft: bt,
        running: autoContinue,
        flash: 'break',
        _startedAt: autoContinue ? Date.now() : null,
        _startedTimeLeft: bt,
      }));
      return 'focus_complete';
    } else {
      const wt = calcWork(preset, customWork);
      set({
        isBreak: false,
        timeLeft: wt,
        running: autoContinue,
        flash: 'focus',
        _startedAt: autoContinue ? Date.now() : null,
        _startedTimeLeft: wt,
      });
      return 'break_complete';
    }
  },
}));
