import { createPortal } from 'react-dom';
import { useGamificationStore, computeLevel, getLevelTitle, CHALLENGE_POOL, getDailyChallengesForDate } from '../../store/gamificationStore';
import { useEventsStore } from '../../store/eventsStore';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDate(ds, n) {
  const [y, m, d] = ds.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyRecapModal({ onClose }) {
  const { xp, daily, focusSessionsToday } = useGamificationStore();
  const events = useEventsStore((s) => s.events);

  const today = todayStr();
  const { level, xpInLevel, xpToNext } = computeLevel(xp);
  const levelTitle = getLevelTitle(level);

  // Last 7 days breakdown
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(today, i - 6);
    const [y, mo, da] = date.split('-').map(Number);
    const dayName = DAY_SHORT[new Date(y, mo - 1, da).getDay()];
    const dayEvents = events.filter((e) => {
      const end = e.end_date || e.start_date;
      return e.start_date <= date && end >= date;
    });
    const done = dayEvents.filter((e) => e.completed).length;
    const total = dayEvents.length;
    return { date, dayName, done, total, isToday: date === today };
  });

  const totalDoneWeek = last7.reduce((s, d) => s + d.done, 0);
  const maxDone = Math.max(...last7.map((d) => d.done), 1);
  const activeDays = last7.filter((d) => d.done > 0).length;

  // Compute streak
  const completedDates = new Set(events.filter((e) => e.completed).map((e) => e.start_date));
  let streak = 0;
  let checkDate = completedDates.has(today) ? today : shiftDate(today, -1);
  while (completedDates.has(checkDate)) { streak++; checkDate = shiftDate(checkDate, -1); }

  // Daily challenges progress
  const todayChallenges = getDailyChallengesForDate(today);
  const challengesDoneToday = daily
    ? daily.challenges.filter((c) => c.done).length
    : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-accent-400 via-yellow-400 to-accent-600" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Weekly Recap</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Last 7 days</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Level + XP bar */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Level {level}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{levelTitle}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-accent-500">{xp} XP total</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500"
                style={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right">
              {xpInLevel}/{xpToNext} XP to Level {level + 1}
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
              <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">{totalDoneWeek}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium">Tasks done</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
              <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">{streak}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium">Day streak</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
              <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">{activeDays}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium">Active days</p>
            </div>
          </div>

          {/* 7-day bar chart */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Tasks per day</p>
            <div className="flex items-end gap-1 h-16">
              {last7.map(({ date, dayName, done, isToday }) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        done > 0
                          ? isToday
                            ? 'bg-accent-500'
                            : 'bg-accent-500/50'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                      style={{ height: `${Math.max((done / maxDone) * 100, done === 0 ? 8 : 15)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold ${isToday ? 'text-accent-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {dayName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's challenges */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Today&apos;s challenges <span className="text-accent-500">{challengesDoneToday}/{todayChallenges.length}</span>
            </p>
            <div className="flex gap-2">
              {todayChallenges.map((c) => {
                const done = daily?.challenges.find((ch) => ch.id === c.id)?.done ?? false;
                const poolDef = CHALLENGE_POOL.find((p) => p.id === c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex-1 rounded-xl p-2 text-center ${
                      done ? 'bg-accent-500/10 border border-accent-500/20' : 'bg-gray-50 dark:bg-gray-800/60'
                    }`}
                  >
                    <div className={`text-base mb-0.5 ${done ? 'grayscale-0' : 'grayscale opacity-40'}`}>
                      {done ? '⭐' : '○'}
                    </div>
                    <p className={`text-[9px] font-medium leading-tight ${done ? 'text-accent-600 dark:text-accent-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      +{poolDef?.xp ?? 25} XP
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focus sessions today */}
          {focusSessionsToday > 0 && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {focusSessionsToday} focus session{focusSessionsToday !== 1 ? 's' : ''} completed today
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Keep it up! 🚀
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
