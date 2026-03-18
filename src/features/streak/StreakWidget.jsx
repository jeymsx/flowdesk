import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEventsStore } from '../../store/eventsStore';
import { useWidgetStore } from '../../store/widgetStore';
import { SkeletonBlock, SkeletonLine } from '../../components/Skeleton';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDate(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateStr(new Date(y, m - 1, d + n));
}

function computeStats(events) {
  const today = toDateStr(new Date());
  const completedByDate = {};
  const totalByDate = {};

  for (const evt of events) {
    const d = evt.start_date;
    totalByDate[d] = (totalByDate[d] || 0) + 1;
    if (evt.completed) completedByDate[d] = (completedByDate[d] || 0) + 1;
  }

  // Current streak — if today has completions count it, else start from yesterday
  let streak = 0;
  let checkDate = completedByDate[today] ? today : shiftDate(today, -1);
  while (completedByDate[checkDate]) {
    streak++;
    checkDate = shiftDate(checkDate, -1);
  }

  // Best streak across all history
  const allDates = Object.keys(completedByDate).sort();
  let bestStreak = streak;
  let run = 0;
  let prev = null;
  for (const d of allDates) {
    run = prev && shiftDate(prev, 1) === d ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = shiftDate(today, i - 6);
    const [y, mo, da] = d.split('-').map(Number);
    return {
      date: d,
      dayInitial: DAY_INITIALS[new Date(y, mo - 1, da).getDay()],
      completed: completedByDate[d] || 0,
      total: totalByDate[d] || 0,
      isToday: d === today,
    };
  });

  const todayCompleted = completedByDate[today] || 0;
  const todayTotal = totalByDate[today] || 0;
  const totalLast7 = last7.reduce((s, d) => s + d.completed, 0);
  const avgPerDay = (totalLast7 / 7).toFixed(1);

  return { streak, todayCompleted, todayTotal, last7, bestStreak, totalLast7, avgPerDay };
}

function StreakSkeleton() {
  return (
    <div className="h-full flex flex-col p-3 gap-3">
      <SkeletonLine className="h-4 w-28 shrink-0" />
      <div className="flex flex-col items-center gap-1.5 py-2 shrink-0">
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
        <SkeletonLine className="h-3 w-20" />
      </div>
      <div className="shrink-0 space-y-1.5">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
      <div className="flex gap-1 shrink-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} className="flex-1 h-10 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 shrink-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function StreakWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const { events, loading, load } = useEventsStore();

  useEffect(() => {
    if (userId) load(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const [statsOpen, setStatsOpen] = useState(false);
  const setWidgetHeight = useWidgetStore((s) => s.setWidgetHeight);

  const toggleStats = () => {
    setStatsOpen((v) => {
      const next = !v;
      setWidgetHeight('streak-1', next ? 6 : 5);
      return next;
    });
  };
  const stats = useMemo(() => computeStats(events), [events]);

  if (loading && events.length === 0) return <StreakSkeleton />;

  const { streak, todayCompleted, todayTotal, last7, bestStreak, totalLast7, avgPerDay } = stats;
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Consistency
        </h3>
      </div>

      {/* Current streak */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <span className="text-4xl font-extrabold tabular-nums text-accent-500 leading-none">{streak}</span>
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">
          {streak === 1 ? 'day' : 'days'}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">current streak</span>
        {streak === 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Complete a task to start one!</span>
        )}
      </div>

      {/* Today's progress */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Today</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
            {todayCompleted} / {todayTotal}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${todayProgress}%` }}
          />
        </div>
        {todayTotal === 0 && (
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">No tasks scheduled today</p>
        )}
      </div>

      {/* Last 7 days */}
      <div className="shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Last 7 Days</p>
        <div className="flex gap-1">
          {last7.map(({ date, dayInitial, completed, total, isToday }) => {
            const done = completed > 0;
            const hasTasks = total > 0;
            return (
              <div
                key={date}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${
                  isToday ? 'ring-1 ring-accent-500/50' : ''
                } ${
                  done
                    ? 'bg-accent-500/15'
                    : hasTasks
                    ? 'bg-red-500/8 dark:bg-red-500/10'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase leading-none">
                  {dayInitial}
                </span>
                <span className={`text-[11px] font-bold leading-none mt-0.5 ${
                  done
                    ? 'text-accent-500'
                    : hasTasks
                    ? 'text-red-400'
                    : 'text-gray-300 dark:text-gray-700'
                }`}>
                  {done ? '✔' : hasTasks ? '✖' : '·'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats — collapsible */}
      <div className="shrink-0">
        <button
          onClick={toggleStats}
          className="w-full flex items-center justify-between group"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            Stats
          </p>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${statsOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="overflow-hidden transition-all duration-200"
          style={{ maxHeight: statsOpen ? '120px' : '0px' }}
        >
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 text-center">
              <p className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">{bestStreak}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium leading-tight">Best<br/>Streak</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 text-center">
              <p className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">{totalLast7}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium leading-tight">Last<br/>7 Days</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 text-center">
              <p className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">{avgPerDay}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium leading-tight">Avg<br/>/ Day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
