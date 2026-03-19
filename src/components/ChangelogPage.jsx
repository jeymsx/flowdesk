import { Link } from 'react-router-dom';

const RELEASES = [
  {
    version: '1.0.0',
    label: 'Initial Launch',
    date: 'March 19, 2026',
    description: 'FlowDesk is live. Everything you see today is part of the first release.',
    sections: [
      {
        title: 'Dashboard',
        color: 'accent',
        items: [
          'Fully customisable dashboard with drag-and-drop, resizable widgets',
          'Multiple breakpoint layouts (desktop → mobile) saved automatically',
          'Save, rename, and switch between named layout presets',
          'Lock / unlock widgets to prevent accidental moves',
          'Widget visibility toggled from the sidebar',
        ],
      },
      {
        title: 'Tasks',
        color: 'blue',
        items: [
          'Task list with Today / Upcoming / Past / All filters',
          'Filter by a specific date using the date picker',
          'Drag-and-drop reordering for incomplete tasks',
          'Color-coded tasks with completion checkboxes',
          'Overdue indicator and progress bar',
          'Edit tasks in an anchored popover with full field editing',
          'Delete with confirmation modal',
          'Tag system — build a personal tag library and select tags when adding or editing tasks',
          'Tag management panel at the bottom of the widget (create & delete tags)',
        ],
      },
      {
        title: 'Calendar',
        color: 'purple',
        items: [
          'Mini calendar widget with colored event dots per day',
          'Click any day to open a popover — view, add, and delete events for that date',
          'Fullscreen calendar mode with a full month grid and a right-side events panel',
          'Add and edit events with title, description, tags, color, start and end dates',
          'Mobile calendar view with a bottom sheet day detail panel',
        ],
      },
      {
        title: 'Bookmarks',
        color: 'yellow',
        items: [
          'Save links with an optional title (falls back to domain name), annotation, and folder',
          'Add bookmark via a popover anchored to the + button',
          'Switch between list view and card view',
          'Favorite bookmarks float to the top as a starred section',
          'Remaining bookmarks grouped by date (Today, Yesterday, weekday, short date)',
          'Favicon display with fallback icon',
          'Inline edit and delete with confirmation',
        ],
      },
      {
        title: 'Milestones',
        color: 'pink',
        items: [
          'Track project milestones with a title, target date, and progress',
          'Add milestone via a popover — title shown exactly as typed',
          'Visual progress bars per milestone',
        ],
      },
      {
        title: 'Focus Timer',
        color: 'red',
        items: [
          'Pomodoro-style focus timer with custom session and break durations',
          'Visual ring countdown with accent color',
          'Sidebar warns before hiding the widget while a session is running',
        ],
      },
      {
        title: 'Music',
        color: 'teal',
        items: [
          'Embedded YouTube music player with curated playlists',
          'Add a custom YouTube URL via a popover',
          'Playback controls directly in the widget',
        ],
      },
      {
        title: 'Notes',
        color: 'orange',
        items: [
          'Rich freeform note editor synced to your account',
          'Auto-saves as you type',
        ],
      },
      {
        title: 'Streak & Stats',
        color: 'accent',
        items: [
          'Streak tracker counts consecutive days with at least one completed task',
          'Sidebar quick stats show today\'s task completion and current streak',
        ],
      },
      {
        title: 'Sidebar',
        color: 'gray',
        items: [
          'Collapsible sidebar with icon-only mode',
          'Quick-add task directly from the sidebar (with tags, description, color, end date)',
          'FlowDesk logo links back to the landing page',
          'Dark / light mode toggle',
          'PWA install prompt',
          'Sign out and reset layout actions',
        ],
      },
      {
        title: 'Account & Onboarding',
        color: 'blue',
        items: [
          'Email / password sign-up and login',
          'Username setup on first login',
          'All data synced via Supabase — works across devices',
          'Terms & Conditions and Privacy Policy pages',
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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-400 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to FlowDesk
        </Link>

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

          <div className="space-y-16">
            {RELEASES.map((release) => (
              <div key={release.version} className="relative pl-8">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-accent-500 ring-4 ring-gray-50 dark:ring-gray-950" />

                {/* Release header */}
                <div className="flex flex-wrap items-baseline gap-3 mb-1">
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
