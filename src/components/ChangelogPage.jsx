import { Link, useNavigate } from 'react-router-dom';

const RELEASES = [
  {
    version: '1.1.0',
    label: 'Gamification Update',
    date: 'March 20, 2026',
    description: 'FlowDesk now rewards consistency — earn XP, level up, hit streak milestones, and compete on the leaderboard.',
    sections: [
      {
        title: 'Gamification',
        color: 'yellow',
        items: [
          'XP & Levels — earn XP for completing tasks, finishing focus sessions, and hitting streak milestones. Level up with titles from Newcomer to Legend',
          'Daily Challenges — 3 rotating goals every day with bonus XP on completion',
          'Streak milestones at 7, 30, and 100 days — unlock badges and one-time bonus XP',
          'Global leaderboard — see how you rank against other users',
          'Weekly Recap — level progress, 7-day activity, and challenge summary',
        ],
      },
      {
        title: 'New Features',
        color: 'blue',
        items: [
          'Demo mode — try the full dashboard without signing up',
          'Focus Timer pop-out — detach a draggable mini-timer that stays visible anywhere',
          'Send Feedback — submit bug reports or suggestions directly from the sidebar',
        ],
      },
      {
        title: 'Polish',
        color: 'gray',
        items: [
          'Sidebar reorganised — pinned Add Task button, grouped bottom actions, progress card',
          'Landing page refreshed — new hero copy, "How it works" section, feature card glow effects',
          'Edit task popover redesigned with more room and a cleaner layout',
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    label: 'Initial Launch',
    date: 'March 19, 2026',
    description: 'FlowDesk is live — a fully customisable productivity dashboard built around your workflow.',
    sections: [
      {
        title: 'Dashboard',
        color: 'accent',
        items: [
          'Drag-and-drop, resizable widgets — arrange your layout however you want',
          'Save and switch between named layout presets; lock widgets to prevent accidental moves',
        ],
      },
      {
        title: 'Widgets',
        color: 'blue',
        items: [
          'Tasks — filters, tags, color-coding, drag-to-reorder, and a daily progress bar',
          'Calendar — mini widget + fullscreen month view with events and multi-day support',
          'Notes — freeform editor that auto-saves as you type',
          'Focus Timer — Pomodoro-style countdown with custom session and break durations',
          'Bookmarks — save links with folders, annotations, and a favorites section',
          'Milestones — track longer-term goals with target dates and progress bars',
          'Music — embedded YouTube player with curated playlists or your own URL',
        ],
      },
      {
        title: 'Account',
        color: 'gray',
        items: [
          'Email/password and Google sign-in; all data synced across devices',
          'Dark mode, PWA install support, and collapsible sidebar',
        ],
      },
    ],
  },
];

const COLOR_MAP = {
  accent: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
  blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  red: 'bg-red-500/10 text-red-500 border-red-500/20',
  teal: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  gray: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
};

const DOT_MAP = {
  accent: 'bg-accent-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-400',
};

export default function ChangelogPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-400 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Page header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Changelog</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            A running log of every update shipped to FlowDesk.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />

          <div className="space-y-0">
            {RELEASES.map((release, idx) => (
              <div key={release.version} className={`relative pl-8 ${idx > 0 ? 'pt-12 mt-12 border-t border-gray-200 dark:border-gray-800' : ''}`}>
                {/* Timeline dot */}
                <div className={`absolute left-0 w-3.5 h-3.5 rounded-full bg-accent-500 ring-4 ring-gray-50 dark:ring-gray-950 ${idx > 0 ? 'top-[49px]' : 'top-1.5'}`} />

                {/* Release header */}
                <div className="flex flex-wrap items-baseline gap-2.5 mb-1">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    v{release.version}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20">
                    {release.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{release.date}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{release.description}</p>

                {/* Feature sections */}
                <div className="space-y-6">
                  {release.sections.map((section) => (
                    <div key={section.title}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_MAP[section.color]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_MAP[section.color]}`} />
                          {section.title}
                        </span>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-600 space-x-4">
          <Link to="/" className="hover:text-gray-500 transition-colors">Home</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-gray-500 transition-colors">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-gray-500 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
