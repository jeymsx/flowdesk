import { useEffect } from 'react';
import { useGamificationStore, CHALLENGE_POOL, getDailyChallengesForDate } from '../../store/gamificationStore';
import { useEventsStore } from '../../store/eventsStore';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(events) {
  const completedDates = new Set(events.filter((e) => e.completed).map((e) => e.start_date));
  const today = todayStr();
  function shiftDate(ds, n) {
    const [y, m, d] = ds.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  let streak = 0;
  let d = completedDates.has(today) ? today : shiftDate(today, -1);
  while (completedDates.has(d)) { streak++; d = shiftDate(d, -1); }
  return streak;
}

export default function DailyChallenges({ collapsed }) {
  const { daily, completeChallenge, focusSessionsToday, loaded } = useGamificationStore();
  const events = useEventsStore((s) => s.events);

  const today = todayStr();
  const todayEvents = events.filter((e) => {
    const end = e.end_date || e.start_date;
    return e.start_date <= today && end >= today;
  });
  const tasksDoneToday = todayEvents.filter((e) => e.completed).length;
  const tasksTotalToday = todayEvents.length;
  const streak = computeStreak(events);

  const challengeState = { tasksDoneToday, tasksTotalToday, focusSessionsToday, streak };

  // Auto-complete challenges when conditions are met
  useEffect(() => {
    if (!loaded || !daily) return;
    const todayChallenges = getDailyChallengesForDate(today);
    for (const c of todayChallenges) {
      const poolDef = CHALLENGE_POOL.find((p) => p.id === c.id);
      if (!poolDef) continue;
      const existing = daily.challenges.find((ch) => ch.id === c.id);
      if (existing?.done) continue;
      if (poolDef.check(challengeState)) {
        completeChallenge(c.id);
      }
    }
  }, [tasksDoneToday, focusSessionsToday, streak, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || !daily) return null;

  const todayChallenges = getDailyChallengesForDate(today);
  const doneCount = daily.challenges.filter((c) => c.done).length;

  if (collapsed) {
    // Collapsed sidebar: show a small icon with count
    return (
      <div className="flex flex-col items-center gap-0.5 px-3 py-2">
        <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="text-[9px] font-bold text-gray-400">{doneCount}/3</span>
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-3 pb-1 px-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Daily Challenges
        </p>
        <span className="text-[10px] font-semibold text-accent-500">{doneCount}/3</span>
      </div>
      <div className="space-y-1.5">
        {todayChallenges.map((c) => {
          const poolDef = CHALLENGE_POOL.find((p) => p.id === c.id);
          const storeChallenge = daily.challenges.find((ch) => ch.id === c.id);
          const done = storeChallenge?.done ?? false;
          return (
            <div
              key={c.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                done
                  ? 'bg-accent-500/8 dark:bg-accent-500/10'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center border ${
                done
                  ? 'bg-accent-500 border-accent-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`flex-1 text-[11px] font-medium leading-tight ${
                done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {poolDef?.label ?? c.id}
              </span>
              <span className={`text-[10px] font-bold shrink-0 ${done ? 'text-accent-500' : 'text-gray-400'}`}>
                +{poolDef?.xp ?? 25}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
