import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

const VERSION = 'v2.1.0';

const FEATURES = [
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Calendar',
    description: 'See the week at a glance. Click any day to add events, drag across dates for multi-day tasks. Know exactly what\'s coming — before it sneaks up on you.',
  },
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    title: 'Tasks',
    description: 'Drag to reorder. Filter by today, upcoming, or everything. Tag and color-code until it makes sense to your brain. A live progress bar shows how your day is going.',
  },
  {
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    title: 'Notes',
    description: 'Write and it saves. No buttons, no friction. Capture the random thought, the meeting note, the thing you\'ll definitely forget in four minutes.',
  },
  {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Focus Timer',
    description: 'Set the session length, start the ring, do the work. Pomodoro-style with a live visual countdown. Your sessions, your breaks, your rhythm.',
  },
  {
    icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
    title: 'Bookmarks',
    description: 'Stop losing links in a sea of open tabs. Save them with notes, star the ones you use daily, and they float right to the top. Actually organized.',
  },
  {
    icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2',
    title: 'Milestones',
    description: 'Big goals need a home too. Set a deadline, log progress, watch the bar fill. Keep the long game in sight while you handle what\'s in front of you.',
  },
  {
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    title: 'Music',
    description: 'Drop in a YouTube link or pick a curated playlist. Right there in your workspace. No new tab, no distractions, just the right vibe.',
  },
  {
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    title: 'Tags',
    description: 'Create your tag library once. Reuse it everywhere — tasks, calendar events, sidebar. No re-entering. No inconsistency. Just click and go.',
  },
];

const GAMIFICATION_FEATURES = [
  {
    icon: '⚡',
    title: 'XP & Levels',
    description: 'Check off a task? XP. Finish a session? XP. Hit a milestone? Big XP. Level up, unlock titles, and watch the number go up. Turns out that\'s pretty addictive.',
  },
  {
    icon: '🎯',
    title: 'Daily Challenges',
    description: 'Three fresh challenges drop every day. Complete tasks, run sessions, protect your streak. Knock them all out for a bonus XP haul.',
  },
  {
    icon: '🔥',
    title: 'Streak Milestones',
    description: '7 days. 30 days. 100 days. Hit the milestones, unlock badges, earn bonus XP. And if you\'re about to lose your streak? FlowDesk will tell you before it\'s too late.',
  },
  {
    icon: '🏆',
    title: 'Leaderboard',
    description: 'See where you rank against everyone else. Stay consistent, earn XP, climb the board. Bragging rights are absolutely part of the deal.',
  },
];

const PRINCIPLES = [
  {
    title: 'Your layout, your rules',
    description: 'Drag anything. Resize everything. Lock it when it\'s perfect. Save multiple layouts and switch between them in one click. No two dashboards look the same.',
  },
  {
    title: 'One account, every device',
    description: 'Sign in anywhere and pick up exactly where you left off. Phone, laptop, tablet — it\'s all there, always in sync.',
  },
  {
    title: 'No browser tab required',
    description: 'FlowDesk is a PWA. Install it to your desktop or home screen and it just lives there — ready when you are, no tab required.',
  },
];

// ── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const widgetEnter = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.42, delay: i * 0.07 + 0.38, ease: [0.23, 1, 0.32, 1] },
  }),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtSecs(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Analog clock math (identical to real ClockWidget) ──────────────────────

function handPoint(deg, length, cx = 100, cy = 100) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
}

function MiniAnalogClock({ hours, minutes, seconds }) {
  const hourDeg = (hours % 12) * 30 + minutes * 0.5 + seconds * (0.5 / 60);
  const minDeg = minutes * 6 + seconds * 0.1;
  const secDeg = seconds * 6;
  const hour = handPoint(hourDeg, 52);
  const min = handPoint(minDeg, 68);
  const sec = handPoint(secDeg, 72);
  const secTail = handPoint(secDeg + 180, 18);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <circle cx={100} cy={100} r={92} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-gray-100 dark:text-gray-800" />
      {Array.from({ length: 12 }, (_, i) => {
        const p1 = handPoint(i * 30, 86);
        const p2 = handPoint(i * 30, 76);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="text-gray-400 dark:text-gray-500" />;
      })}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const p1 = handPoint(i * 6, 86);
        const p2 = handPoint(i * 6, 82);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="text-gray-200 dark:text-gray-700" />;
      })}
      <line x1={100} y1={100} x2={hour.x} y2={hour.y} stroke="currentColor" strokeWidth={5} strokeLinecap="round" className="text-gray-800 dark:text-white" />
      <line x1={100} y1={100} x2={min.x} y2={min.y} stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" className="text-gray-700 dark:text-gray-200" />
      <line x1={secTail.x} y1={secTail.y} x2={sec.x} y2={sec.y} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-accent-500" />
      <circle cx={100} cy={100} r={5} fill="currentColor" className="text-gray-800 dark:text-white" />
      <circle cx={100} cy={100} r={2.5} fill="currentColor" className="text-accent-500" />
    </svg>
  );
}

// ── Hero Widget: Focus Timer (exact replica of FocusWidget) ─────────────────

const HERO_PRESETS = [
  { key: '25', label: 'Sprint',      sub: '25 / 5 min',   totalSecs: 25 * 60 },
  { key: '50', label: 'Deep Work',   sub: '50 / 10 min',  totalSecs: 50 * 60 },
  { key: '90', label: 'Flow State',  sub: '90 / 15 min',  totalSecs: 90 * 60 },
  { key: 'c',  label: 'Custom',      sub: 'Set your own', totalSecs: 25 * 60 },
];

function HeroFocusCard() {
  const [activeKey, setActiveKey] = useState('25');
  const [running, setRunning] = useState(true);
  const [t, setT] = useState(Math.floor(25 * 60 * 0.58)); // Sprint: ~14:30 remaining

  const preset = HERO_PRESETS.find((p) => p.key === activeKey);

  const handlePreset = (key) => {
    setActiveKey(key);
    const p = HERO_PRESETS.find((x) => x.key === key);
    setT(Math.floor(p.totalSecs * 0.58));
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const total = preset.totalSecs;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, (total - t) / total);

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col p-4 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Focus Timer
        </h3>
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-lg bg-accent-500/15 text-accent-600 dark:text-accent-400">Auto break</span>
      </div>

      {/* Mode selector — named presets with ratios */}
      <div className="grid grid-cols-4 gap-1 mb-3 shrink-0">
        {HERO_PRESETS.map(({ key, label, sub }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`flex flex-col items-center py-1.5 px-0.5 rounded-lg transition-colors ${
              activeKey === key
                ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="text-[10px] font-semibold leading-tight">{label}</span>
            <span className={`text-[9px] leading-tight mt-0.5 ${activeKey === key ? 'text-accent-500/70 dark:text-accent-400/60' : 'text-gray-400 dark:text-gray-600'}`}>{sub}</span>
          </button>
        ))}
      </div>

      {/* Ring + controls */}
      <div className="flex-1 flex flex-col items-center justify-center py-1 gap-3 min-h-0">
        <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
            <circle
              cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              className="text-accent-500"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] sm:text-[20px] font-bold tabular-nums leading-none text-gray-900 dark:text-white">{fmtSecs(t)}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-accent-500 mt-0.5">{preset.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setRunning((v) => !v)}
            className="w-14 h-14 flex items-center justify-center rounded-full text-white shadow-lg bg-accent-500 hover:bg-accent-600 shadow-accent-500/30 transition-all active:scale-95"
          >
            {running
              ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
              : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            }
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
            </svg>
          </button>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < 2 ? 'bg-accent-500 scale-110' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">2 sessions today</span>
        </div>
      </div>
    </div>
  );
}

// ── Hero Widget: Tasks (exact replica of TasksWidget) ───────────────────────

const HERO_TASKS_DATA = [
  { id: 1, text: 'Review design mockups',   done: true,  color: '#22c55e', date: 'Mar 21' },
  { id: 2, text: 'Ship v1.4 to production', done: true,  color: '#3b82f6', date: 'Mar 21' },
  { id: 3, text: 'Write weekly update',     done: false, color: '#f59e0b', date: 'Mar 21', tag: 'work' },
  { id: 4, text: 'Plan Q2 roadmap',         done: false, color: '#8b5cf6', date: 'Mar 22', tag: 'planning' },
];

const TAG_COLORS = { work: '#f59e0b', planning: '#8b5cf6' };

function HeroTasksCard() {
  const [tasks, setTasks] = useState(HERO_TASKS_DATA);

  useEffect(() => {
    const id = setTimeout(
      () => setTasks((p) => p.map((t) => (t.id === 3 ? { ...t, done: true } : t))),
      2800
    );
    return () => clearTimeout(id);
  }, []);

  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden select-none">
      {/* Header — matches TasksWidget */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Tasks
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{done}/{tasks.length} done</span>
          <div className="p-1 rounded-lg text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter pills — same as real widget */}
      <div className="flex items-center gap-1.5 px-3 pb-2 shrink-0">
        {['Today', 'Upcoming', 'Past', 'All'].map((f) => (
          <button
            key={f}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              f === 'Today'
                ? 'bg-accent-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Progress bar — same as real widget */}
      <div className="px-3 pb-2 shrink-0">
        <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-500 rounded-full"
            animate={{ width: `${(done / tasks.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Task list — same item structure as real widget */}
      <div className="flex-1 overflow-hidden px-2 pb-2 min-h-0 space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`px-2.5 py-2 rounded-xl border transition-all ${
              task.done
                ? 'border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20'
                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-2">
              {/* Drag handle — same SVG as real */}
              {!task.done ? (
                <div className="mt-1 shrink-0 text-gray-300 dark:text-gray-600">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                    <circle cx="4" cy="2.5" r="1" /><circle cx="8" cy="2.5" r="1" />
                    <circle cx="4" cy="6" r="1" /><circle cx="8" cy="6" r="1" />
                    <circle cx="4" cy="9.5" r="1" /><circle cx="8" cy="9.5" r="1" />
                  </svg>
                </div>
              ) : (
                <div className="w-3 shrink-0" />
              )}

              {/* Checkbox — same as real widget */}
              <motion.div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  task.done ? 'border-accent-500 bg-accent-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                animate={task.done ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.25 }}
              >
                {task.done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </motion.div>

              {/* Color dot — same as real */}
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: task.color, opacity: task.done ? 0.4 : 1 }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-tight transition-all duration-300 ${
                  task.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {task.text}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">{task.date}</span>
                  {task.tag && !task.done && (
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                      style={{ backgroundColor: TAG_COLORS[task.tag] + '22', color: TAG_COLORS[task.tag] }}
                    >
                      {task.tag}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tags footer — same as real */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800">
        <div className="w-full flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">Tags</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-600">(2)</span>
          </div>
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Hero Widget: Clock (exact replica of ClockWidget) ───────────────────────

function HeroClockCard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMins = -now.getTimezoneOffset();
  const offsetSign = offsetMins >= 0 ? '+' : '-';
  const absH = String(Math.floor(Math.abs(offsetMins) / 60)).padStart(2, '0');
  const absM = String(Math.abs(offsetMins) % 60).padStart(2, '0');
  const utcOffset = `UTC${offsetSign}${absH}:${absM}`;
  const tzCity = timezone.split('/').pop().replace(/_/g, ' ');

  const digitalTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col p-3 gap-2 overflow-hidden select-none">
      {/* Header — same as real ClockWidget */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Clock
        </h3>
        <div className={`p-1 rounded-lg bg-accent-500/15 text-accent-500`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </svg>
        </div>
      </div>

      {/* Analog face — same as real, with maxWidth/maxHeight constraint */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div style={{ width: '100%', height: '100%', maxWidth: '110px', maxHeight: '110px' }}>
          <MiniAnalogClock
            hours={now.getHours()}
            minutes={now.getMinutes()}
            seconds={now.getSeconds()}
          />
        </div>
      </div>

      {/* Digital readout — same as real */}
      <div className="text-center shrink-0 space-y-0.5">
        <p className="text-base font-bold tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
          {digitalTime}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{dateStr}</p>
        <p className="text-[9px] text-gray-400 dark:text-gray-500">{tzCity} · {utcOffset}</p>
      </div>
    </div>
  );
}

// ── Hero Widget: Streak/Consistency (exact replica of StreakWidget) ──────────

const HERO_LAST7 = [
  { day: 'S', done: false, hasTasks: false },
  { day: 'M', done: true,  hasTasks: true  },
  { day: 'T', done: true,  hasTasks: true  },
  { day: 'W', done: true,  hasTasks: true  },
  { day: 'T', done: true,  hasTasks: true  },
  { day: 'F', done: true,  hasTasks: true  },
  { day: 'S', done: false, hasTasks: false, isToday: true },
];

function HeroStreakCard() {
  const currentStreak = 14;
  const bestStreak = 22;
  const milestones = [7, 30, 100];
  const nextMilestone = milestones.find((m) => m > currentStreak) ?? milestones[milestones.length - 1];
  const prevMilestone = [...milestones].reverse().find((m) => m <= currentStreak) ?? 0;
  const milestoneProgress = (currentStreak - prevMilestone) / (nextMilestone - prevMilestone);
  const daysToNext = nextMilestone - currentStreak;

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col p-3 gap-2 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Consistency
        </h3>
      </div>

      {/* Current + best streak side by side */}
      <div className="flex items-center justify-around shrink-0 px-1">
        <div className="flex flex-col items-center">
          <div className="flex items-end gap-1">
            <motion.span
              className="text-3xl font-extrabold tabular-nums text-accent-500 leading-none"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 220, damping: 14 }}
            >
              {currentStreak}
            </motion.span>
            <span className="text-lg leading-none mb-0.5">🔥</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">current streak</span>
        </div>
        <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 shrink-0" />
        <div className="flex flex-col items-center">
          <div className="flex items-end gap-1">
            <span className="text-xl font-extrabold tabular-nums text-gray-300 dark:text-gray-600 leading-none">{bestStreak}</span>
            <span className="text-sm leading-none mb-0.5">🏆</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">personal best</span>
        </div>
      </div>

      {/* Milestone progress track */}
      <div className="shrink-0 px-0.5">
        <div className="flex items-center gap-1">
          {/* 7d — reached */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm shadow-yellow-400/40">
              <span className="text-[8px] font-bold text-white">7</span>
            </div>
            <span className="text-[8px] font-semibold text-yellow-500">🏅</span>
          </div>
          {/* Track 7 → 30 */}
          <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${milestoneProgress * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
            />
          </div>
          {/* 30d — next target */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <span className="text-[7px] font-bold text-gray-400">30</span>
            </div>
            <span className="text-[8px] text-gray-400">d</span>
          </div>
          {/* Track 30 → 100 */}
          <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
          {/* 100d — locked */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <span className="text-[6px] font-bold text-gray-300 dark:text-gray-600">100</span>
            </div>
            <span className="text-[8px] text-gray-300 dark:text-gray-700">d</span>
          </div>
        </div>
        <p className="text-[10px] text-accent-600 dark:text-accent-400 font-semibold text-center mt-1.5">
          {daysToNext} more days to 30-day badge 🏅
        </p>
      </div>

      {/* Last 7 days */}
      <div className="shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Last 7 Days</p>
        <div className="flex gap-1">
          {HERO_LAST7.map(({ day, done, hasTasks, isToday }, i) => (
            <div
              key={i}
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
              <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase leading-none">{day}</span>
              <span className={`text-[11px] font-bold leading-none mt-0.5 ${
                done ? 'text-accent-500' : hasTasks ? 'text-red-400' : 'text-gray-300 dark:text-gray-700'
              }`}>
                {done ? '✔' : hasTasks ? '✖' : '·'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hero XP Toast notification ──────────────────────────────────────────────

function HeroXPToast() {
  const [show, setShow] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const s = setTimeout(() => setShow(true), 3200);
    const g = setTimeout(() => setGone(true), 5800);
    return () => { clearTimeout(s); clearTimeout(g); };
  }, []);
  return (
    <AnimatePresence>
      {show && !gone && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.88, x: 12 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, y: -4, scale: 0.9, x: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="absolute bottom-3 right-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-2.5 py-2 shadow-xl shadow-black/8 flex items-center gap-2 pointer-events-none z-20"
        >
          <div className="w-6 h-6 rounded-full bg-accent-500/15 flex items-center justify-center shrink-0">
            <span className="text-[11px]">⚡</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-900 dark:text-white leading-tight">+25 XP earned</p>
            <p className="text-[9px] text-gray-400 leading-tight">Focus session complete</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Feature card with cursor glow ───────────────────────────────────────────

function FeatureCard({ f, variants }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={cardRef}
      variants={variants}
      onMouseMove={(e) => {
        const rect = cardRef.current.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-accent-200 dark:hover:border-accent-800 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col gap-4 overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(34,197,94,0.10), transparent 70%)`,
        }}
      />
      <div className="w-8 h-8 rounded text-gray-400 dark:text-gray-500 group-hover:text-accent-500 transition-colors flex items-center justify-center shrink-0">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{f.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{f.description}</p>
      </div>
    </motion.div>
  );
}

// ── Logo ────────────────────────────────────────────────────────────────────

const LogoIcon = ({ className, strokeWidth = 2 }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

// ── Sidebar icons for mini browser preview ───────────────────────────────────

const SIDEBAR_ICONS = [
  { d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', active: false },
  { d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', active: false },
  { d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', active: false },
  { d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', active: true },
  { d: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', active: false },
];

// ── Main landing page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col font-sans antialiased transition-colors">

      {/* ── Nav ── */}
      <header className="border-b border-gray-100/50 dark:border-gray-800/50 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-accent-500 rounded-md flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <LogoIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-medium text-gray-900 dark:text-white tracking-tight">FlowDesk</span>
          </div>

          <nav className="flex items-center gap-3">
            <Link to="/changelog" className="hidden sm:block px-3 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              Changelog
            </Link>
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {user ? (
              <button
                onClick={() => navigate('/app')}
                className="ml-1 px-5 py-2 text-sm font-medium text-white bg-gradient-to-b from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 rounded-lg shadow-sm transition-all"
              >
                Open dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="px-4 sm:px-5 py-1.5 sm:py-2 text-sm font-medium text-white bg-gradient-to-b from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 rounded-lg shadow-sm hover:shadow transition-all">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden">

        {/* Background orbs */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent-100/40 dark:bg-accent-600/10 blur-[120px] rounded-full pointer-events-none"
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-blue-100/20 dark:bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[250px] h-[250px] bg-emerald-100/15 dark:bg-emerald-600/8 blur-[80px] rounded-full pointer-events-none" />

        {/* Floating ambient toasts + badges */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* Streak toast — top left */}
          <motion.div
            initial={{ opacity: 0, x: -24, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-12 left-6 lg:left-16 xl:left-24 hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-black/[0.06]"
            >
              <div className="w-7 h-7 rounded-full bg-orange-400/15 flex items-center justify-center shrink-0">
                <span className="text-sm leading-none">🔥</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">14-day streak!</p>
                <p className="text-[10px] text-gray-400 leading-tight">Keep it going</p>
              </div>
            </motion.div>
          </motion.div>

          {/* XP toast — top right */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-10 right-6 lg:right-16 xl:right-24 hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-black/[0.06]"
            >
              <div className="w-7 h-7 rounded-full bg-accent-500/15 flex items-center justify-center shrink-0">
                <span className="text-sm leading-none">⚡</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">+25 XP earned</p>
                <p className="text-[10px] text-gray-400 leading-tight">Focus session complete</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Daily challenge badge — mid left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-32 left-4 lg:left-12 xl:left-20 hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3 py-2 shadow-lg shadow-black/[0.06]"
            >
              <span className="text-sm leading-none">🎯</span>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Daily challenge done!</span>
            </motion.div>
          </motion.div>

          {/* Level up badge — mid right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-28 right-4 lg:right-12 xl:right-20 hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3 py-2 shadow-lg shadow-black/[0.06]"
            >
              <span className="text-sm leading-none">🏆</span>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Lv. 12 · Focused</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Text content */}
        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-widest mb-8 bg-white dark:bg-gray-900 shadow-sm">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-accent-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Your productivity HQ
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl font-light text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-6 text-balance">
            Stop juggling tabs.{' '}
            <motion.span
              className="text-accent-500 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.5, ease: 'easeOut' }}
            >
              Start getting things done.
            </motion.span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed mb-8 max-w-2xl mx-auto text-balance">
            Tasks, calendar, notes, focus timer, bookmarks — all in one dashboard. Drag, resize, and build the exact workspace your brain needs.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-2 mb-10">
            {[
              'Drag-and-drop layout built for how you think',
              'Every tool in one tab — no more context-switching',
              'XP, streaks, and challenges that actually motivate',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-light">
                <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/app')}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-b from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Go to your dashboard &rarr;
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-b from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Get started — it's free
                </button>
                <button
                  onClick={() => navigate('/demo')}
                  className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg transition-all hover:-translate-y-0.5"
                >
                  See it in action
                </button>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* ── Live dashboard preview ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.32, ease: [0.23, 1, 0.32, 1] }}
          className="mt-20 max-w-5xl w-full mx-auto relative z-10"
        >
          {/* Ambient glow */}
          <div className="absolute -inset-x-10 -top-10 bottom-0 pointer-events-none" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-b from-accent-300/25 via-accent-200/10 to-transparent dark:from-accent-600/18 dark:via-accent-600/5 dark:to-transparent blur-3xl rounded-3xl" />
          </div>

          {/* Browser frame */}
          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.13),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden">

            {/* Titlebar */}
            <div className="bg-gray-50/90 dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="hidden sm:flex flex-1 justify-center">
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1 gap-1.5 w-44">
                  <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[10px] text-gray-400 font-mono">go-flowdesk.vercel.app</span>
                </div>
              </div>
            </div>

            {/* App shell: sidebar + widget grid */}
            <div className="flex bg-gray-50/70 dark:bg-gray-950/80">

              {/* Mini sidebar — same structure as real Sidebar */}
              <div className="hidden sm:flex flex-col items-center gap-1 w-11 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800/70 py-3 px-1.5">
                <div className="w-6 h-6 bg-accent-500 rounded-md flex items-center justify-center mb-2 shadow-sm shadow-accent-500/30 shrink-0">
                  <LogoIcon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                {SIDEBAR_ICONS.map(({ d, active }, i) => (
                  <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? 'bg-accent-500/10' : ''}`}>
                    <svg className={`w-3.5 h-3.5 ${active ? 'text-accent-500' : 'text-gray-300 dark:text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Widget grid */}
              <div className="flex-1 p-2.5 sm:p-3 relative overflow-hidden">
                <HeroXPToast />

                {/* 3-col grid: Focus | Tasks | [Clock + Streak stacked] */}
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-2 sm:gap-2.5 sm:h-[460px]">

                  {/* Focus Timer — spans 2 rows */}
                  <motion.div
                    custom={0} initial="hidden" animate="visible" variants={widgetEnter}
                    className="h-80 sm:h-auto sm:row-span-2"
                  >
                    <HeroFocusCard />
                  </motion.div>

                  {/* Tasks — spans 2 rows */}
                  <motion.div
                    custom={1} initial="hidden" animate="visible" variants={widgetEnter}
                    className="h-64 sm:h-auto sm:row-span-2"
                  >
                    <HeroTasksCard />
                  </motion.div>

                  {/* Clock — top-right */}
                  <motion.div
                    custom={2} initial="hidden" animate="visible" variants={widgetEnter}
                    className="hidden sm:block"
                  >
                    <HeroClockCard />
                  </motion.div>

                  {/* Streak — bottom-right */}
                  <motion.div
                    custom={3} initial="hidden" animate="visible" variants={widgetEnter}
                    className="hidden sm:block"
                  >
                    <HeroStreakCard />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Up and running in minutes.</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light max-w-xl mx-auto">Three steps. No setup wizard. No onboarding email sequence. Just open it and go.</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {[
              {
                step: '1', title: 'Throw everything in.',
                description: 'Tasks, goals, notes — dump it all in. Assign dates, colors, and tags. FlowDesk keeps it organized so you don\'t have to think about it.',
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
              },
              {
                step: '2', title: 'Build your perfect layout.',
                description: 'Drag widgets. Resize them. Move them around until it just clicks. Save multiple layouts and switch between them in one click.',
                icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
              },
              {
                step: '3', title: 'Show up. Get rewarded.',
                description: 'Run focus sessions. Earn XP. Hit your streak. FlowDesk makes coming back every day feel less like discipline and more like a game you actually want to win.',
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-900/20 border border-accent-100 dark:border-accent-800/50 flex items-center justify-center text-accent-500 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}
            className="mb-16 md:text-center"
          >
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Eight tools. One tab.</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">Each widget does exactly one thing, really well. Together they replace the six apps you had open in the background.</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} f={f} variants={fadeUp} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Gamification ── */}
      <section className="py-24 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}
            className="mb-12 md:text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-widest mb-6 bg-white dark:bg-gray-900 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              The fun part 🎯
            </div>
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Productive feels good here.</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">FlowDesk rewards you for showing up. Earn XP for every task, every session, every streak you protect. It adds up faster than you'd think.</p>
          </motion.div>

          {/* XP progress visual — same style as real sidebar progress section */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-2xl mx-auto mb-14"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-accent-500/10 flex items-center justify-center shrink-0">
                  <span className="text-xl leading-none">⚡</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Lv. 12 · Focused</span>
                    <span className="text-xs text-gray-400 tabular-nums">1,240 / 1,500 XP</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '82.7%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {[
                  { xp: '+10 XP', note: 'Task done', delay: 0.4 },
                  { xp: '+25 XP', note: 'Focus session', delay: 0.55 },
                  { xp: '+50 XP', note: 'Daily challenge', delay: 0.7 },
                  { xp: '+100 XP', note: '7-day streak', delay: 0.85 },
                ].map(({ xp, note, delay }) => (
                  <motion.div
                    key={xp}
                    initial={{ opacity: 0, y: 4, scale: 0.85 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="text-[11px] font-bold text-accent-500">{xp}</span>
                    <span className="text-[11px] text-gray-400">{note}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {GAMIFICATION_FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-yellow-200 dark:hover:border-yellow-800 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-4"
              >
                <span className="text-2xl leading-none">{f.icon}</span>
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Principles ── */}
      <section className="py-24 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Built for how you actually work.</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                Most tools shove you into their system. FlowDesk doesn't. It bends to fit the way you think, not the other way around.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="flex flex-col gap-10"
            >
              {PRINCIPLES.map((p, i) => (
                <motion.div key={i} variants={fadeUp} className="flex gap-5">
                  <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1.5">{p.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{p.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="py-24 px-6 bg-accent-500 relative overflow-hidden">
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-white/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-white/8 blur-3xl rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center relative z-10"
          >
            <h2 className="text-4xl font-light text-white mb-4 tracking-tight">Ready to finally have a system?</h2>
            <p className="text-white/70 font-light mb-10 text-lg">
              Free. No credit card. No onboarding wizard. Just open it and start.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-accent-600 text-sm font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              >
                Get started — it's free
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 transition-all hover:-translate-y-0.5"
              >
                See it in action first
              </button>
            </div>
            <p className="mt-6 text-xs text-white/40 font-light">Seriously, it takes about 30 seconds to set up.</p>
          </motion.div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-6 bg-white dark:bg-gray-950 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <LogoIcon className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">FlowDesk</span>
            </div>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <Link to="/changelog" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
              {VERSION}
            </Link>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <nav className="flex items-center gap-8 text-xs text-gray-400 dark:text-gray-500">
              <Link to="/changelog" className="hover:text-gray-900 dark:hover:text-white transition-colors">Changelog</Link>
              <Link to="/faq" className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</Link>
              <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
            </nav>
            <span className="text-xs text-gray-300 dark:text-gray-600">© 2026 FlowDesk · Made by James with love ❤️</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
