export const RELEASES = [
  {
    version: '1.3.0',
    label: 'Sidebar Overhaul',
    date: 'March 20, 2026',
    description: 'A redesigned sidebar with a smarter layout, improved navigation, and a much better profile and account experience.',
    sections: [
      {
        title: 'Sidebar',
        color: 'accent',
        items: [
          'User menu moved to the bottom — profile, help, settings, and sign-out all in one place',
          'Leaderboard now lives inside the Progress section for quicker access',
          'Dark mode toggle added to the user menu popover',
          'Sign-out now shows a confirmation modal so you never log out by accident',
        ],
      },
      {
        title: 'Profile',
        color: 'blue',
        items: [
          'Profile modal redesigned — gradient hero header, stat cards with icons, cleaner username section',
          'Username change with real-time availability checking and format validation',
          'Delete account modal completely redesigned — requires typing DELETE to confirm, cannot be undone accidentally',
        ],
      },
      {
        title: 'Bug Fixes',
        color: 'gray',
        items: [
          'Terms & Policies back button now returns to the previous page instead of the landing page',
        ],
      },
    ],
  },
  {
    version: '1.2.0',
    label: 'Focus Timer 2.0',
    date: 'March 20, 2026',
    description: 'A completely rebuilt Focus Timer — now global, persistent, and capable of floating in a Picture-in-Picture window while you work in other tabs.',
    sections: [
      {
        title: 'Focus Timer',
        color: 'teal',
        items: [
          'Pop-out timer — opens as a Picture-in-Picture window on Chrome; draggable floating widget on mobile and Safari/Firefox',
          'Timer persists across page navigation — countdown never resets when switching routes',
          'Auto-continue, session dots, skip button, completion sounds, and tab title countdown',
        ],
      },
      {
        title: 'Bug Fixes',
        color: 'gray',
        items: [
          'Widgets no longer reload on tab switch or browser minimize',
          'Clock widget height, blank notes prevention, bookmark edit popover, iOS calendar safe area',
        ],
      },
    ],
  },
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

export const COLOR_MAP = {
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

export const DOT_MAP = {
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
