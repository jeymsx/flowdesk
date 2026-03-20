import { create } from 'zustand';
import { getGamification, saveGamification, awardXPRemote } from '../services/gamification';

// ── Level system ───────────────────────────────────────────────────────────────
// Linear: 100 XP per level

export function computeLevel(xp) {
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  return { level, xpInLevel, xpToNext: 100 };
}

export function getLevelTitle(level) {
  if (level >= 50) return 'Legend';
  if (level >= 30) return 'Flow Master';
  if (level >= 20) return 'Deep Worker';
  if (level >= 15) return 'Consistent';
  if (level >= 10) return 'Achiever';
  if (level >= 5) return 'Focused';
  return 'Newcomer';
}

// ── Daily challenge pool ───────────────────────────────────────────────────────
// s = { tasksDoneToday, tasksTotalToday, focusSessionsToday, streak }

export const CHALLENGE_POOL = [
  { id: 'tasks_1', label: 'Complete 1 task today', xp: 15, check: (s) => s.tasksDoneToday >= 1 },
  { id: 'tasks_2', label: 'Complete 2 tasks today', xp: 20, check: (s) => s.tasksDoneToday >= 2 },
  { id: 'tasks_3', label: 'Complete 3 tasks today', xp: 25, check: (s) => s.tasksDoneToday >= 3 },
  { id: 'tasks_5', label: 'Complete 5 tasks today', xp: 40, check: (s) => s.tasksDoneToday >= 5 },
  { id: 'tasks_all', label: "Clear all of today's tasks", xp: 35, check: (s) => s.tasksTotalToday > 0 && s.tasksDoneToday === s.tasksTotalToday },
  { id: 'focus_1', label: 'Complete a focus session', xp: 20, check: (s) => s.focusSessionsToday >= 1 },
  { id: 'focus_2', label: 'Finish 2 focus sessions', xp: 35, check: (s) => s.focusSessionsToday >= 2 },
  { id: 'streak_alive', label: 'Keep your streak alive', xp: 20, check: (s) => s.streak >= 1 },
];

function getDayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

export function getDailyChallengesForDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const seed = getDayOfYear(date) * 31 + y;
  const sorted = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = (seed * 1013 + a.id.charCodeAt(0) * 7) % 1000;
    const hb = (seed * 1013 + b.id.charCodeAt(0) * 7) % 1000;
    return ha - hb;
  });
  return sorted.slice(0, 3);
}

// ── Streak milestones ──────────────────────────────────────────────────────────
export const STREAK_MILESTONES = [
  { days: 7, xp: 50, label: '7-day streak!' },
  { days: 30, xp: 100, label: '30-day streak!' },
  { days: 100, xp: 200, label: '100-day streak!' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let saveTimeout = null;
function debouncedSave(userId, get) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const { xp, daily, streakMilestonesClaimed } = get();
    saveGamification(userId, { xp, daily, streakMilestonesClaimed }).catch(() => {});
  }, 1000);
}

// ── Store ──────────────────────────────────────────────────────────────────────
export const useGamificationStore = create((set, get) => ({
  xp: 0,
  daily: null,               // { date, challenges: [{id, done}] }
  streakMilestonesClaimed: [],
  focusSessionsToday: 0,     // in-memory only
  xpToasts: [],              // [{id, amount, reason}]
  _userId: null,
  loaded: false,

  load: async (userId) => {
    if (get()._userId === userId && get().loaded) return;
    set({ _userId: userId, loaded: false });
    try {
      const data = await getGamification(userId);
      const today = todayStr();
      let daily = data.daily;
      if (!daily || daily.date !== today) {
        const challenges = getDailyChallengesForDate(today).map((c) => ({ id: c.id, done: false }));
        daily = { date: today, challenges };
      }
      set({
        xp: data.xp || 0,
        daily,
        streakMilestonesClaimed: data.streakMilestonesClaimed || [],
        loaded: true,
      });
    } catch {
      const today = todayStr();
      const challenges = getDailyChallengesForDate(today).map((c) => ({ id: c.id, done: false }));
      set({ loaded: true, daily: { date: today, challenges } });
    }
  },

  reset: () => {
    clearTimeout(saveTimeout);
    set({ xp: 0, daily: null, streakMilestonesClaimed: [], focusSessionsToday: 0, xpToasts: [], _userId: null, loaded: false });
  },

  awardXP: async (reason) => {
    const { _userId } = get();
    if (!_userId) return;
    try {
      const amount = await awardXPRemote(reason);
      set((s) => ({
        xp: s.xp + amount,
        xpToasts: [...s.xpToasts, { id: crypto.randomUUID(), amount, reason }],
      }));
    } catch {
      // Server rejected the XP award — no local update
    }
  },

  dismissToast: (id) => {
    set((s) => ({ xpToasts: s.xpToasts.filter((t) => t.id !== id) }));
  },

  completeChallenge: async (challengeId) => {
    const { _userId, daily } = get();
    if (!daily) return;
    const existing = daily.challenges.find((c) => c.id === challengeId);
    if (!existing || existing.done) return;

    // Mark done optimistically so the UI updates immediately
    const newChallenges = daily.challenges.map((c) =>
      c.id === challengeId ? { ...c, done: true } : c
    );
    set((s) => ({ daily: { ...s.daily, challenges: newChallenges } }));
    if (_userId) debouncedSave(_userId, get);

    // Award XP via server-validated RPC
    const rpcReason = challengeId === 'streak_alive'
      ? 'challenge_streak'
      : `challenge_${challengeId}`;
    try {
      const amount = await awardXPRemote(rpcReason);
      set((s) => ({
        xp: s.xp + amount,
        xpToasts: [
          ...s.xpToasts,
          { id: crypto.randomUUID(), amount, reason: 'Daily challenge!' },
        ],
      }));
    } catch {
      // XP award failed — challenge still marked done locally
    }
  },

  claimStreakMilestone: async (days) => {
    const { _userId, streakMilestonesClaimed } = get();
    if (streakMilestonesClaimed.includes(days)) return;
    const milestone = STREAK_MILESTONES.find((m) => m.days === days);
    const label = milestone?.label ?? `${days}-day streak!`;

    // Mark claimed optimistically
    const newClaimed = [...streakMilestonesClaimed, days];
    set({ streakMilestonesClaimed: newClaimed });
    if (_userId) debouncedSave(_userId, get);

    // Award XP via server-validated RPC
    try {
      const amount = await awardXPRemote(`milestone_${days}`);
      set((s) => ({
        xp: s.xp + amount,
        xpToasts: [
          ...s.xpToasts,
          { id: crypto.randomUUID(), amount, reason: label },
        ],
      }));
    } catch {
      // XP award failed — milestone still claimed locally
    }
  },

  addFocusSession: () => {
    set((s) => ({ focusSessionsToday: s.focusSessionsToday + 1 }));
    get().awardXP('focus_session');
  },
}));
