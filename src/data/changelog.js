export const RELEASES = [
  {
    version: '2.1.0',
    label: 'Smarter XP, Daily Fixes & Music',
    date: 'March 22, 2026',
    description: 'Leveling up now takes real effort — XP requirements grow as you rank up. Daily challenges reset at the right time for every timezone, the fullscreen timer gets a keyboard shortcut, and the Music widget gets a major upgrade with a mini player, playlist support, and saved links.',
    sections: [
      {
        title: 'Music',
        color: 'teal',
        items: [
          'Mini player — music keeps playing when you navigate to other pages. A floating player appears in the bottom-right corner with controls to skip tracks or stop.',
          'YouTube playlist support — paste a playlist URL and the full queue plays in order. Next and previous buttons skip between tracks in the playlist.',
          'Save custom links — bookmark up to 5 YouTube videos or playlists for quick access. If you skip the label, the video title is fetched automatically.',
          'Invalid URLs now show an error toast instead of silently failing.',
        ],
      },
      {
        title: 'Gamification',
        color: 'yellow',
        items: [
          'XP curve is now incremental — each level requires 50 more XP than the last. Level 1→2 costs 100 XP, 2→3 costs 150 XP, and so on. Early levels are quick; higher ranks take real dedication.',
          'Daily challenges now reset at local midnight — they refresh when your day ends, not at a fixed UTC time.',
        ],
      },
      {
        title: 'Focus Timer',
        color: 'accent',
        items: [
          'Press Space to pause or resume the timer while in fullscreen mode.',
          'Keyboard hints (Space and ESC) are shown at the bottom of the fullscreen view.',
        ],
      },
      {
        title: 'New',
        color: 'blue',
        items: [
          'FAQ page added — answers to the most common questions about FlowDesk, account management, widgets, and privacy.',
        ],
      },
      {
        title: 'Bug Fixes',
        color: 'gray',
        items: [
          'XP earned in the last moments before signing out is no longer lost — a final save is flushed before the session ends.',
          'Layout position is saved exactly once after you finish dragging or resizing a widget, not on every frame during the drag.',
        ],
      },
    ],
  },
  {
    version: '2.0.0',
    label: 'Widgets, Stability & UX',
    date: 'March 21, 2026',
    description: 'Focus Timer gets named modes and a fullscreen view. Consistency shows your personal best and a live milestone track. Widgets crash independently, XP is server-validated, and dozens of small fixes land across bookmarks, clock, tasks, and more.',
    sections: [
      {
        title: 'Focus Timer',
        color: 'accent',
        items: [
          'Preset modes renamed — Sprint (25/5), Deep Work (50/10), Quick (15/3), and Custom. Each tab shows the session/break ratio at a glance.',
          'Fullscreen mode — click the expand icon to fill the entire screen with a large timer. Adapts to light and dark mode. Press ESC to exit.',
          'Timer ring now labels the active mode name instead of the generic "Focus".',
          '"Auto" button renamed to "Auto break" for clarity.',
          'Timer now uses wall-clock time to stay accurate even when the tab is in the background.',
        ],
      },
      {
        title: 'Consistency Widget',
        color: 'blue',
        items: [
          'Personal best streak shown alongside your current streak.',
          'Milestone badges replaced with a live horizontal progress track — the fill advances toward 7, 30, and 100 days in real time.',
          'Motivational line shows exactly how many days remain until your next milestone.',
        ],
      },
      {
        title: 'Widgets',
        color: 'teal',
        items: [
          'Each widget now crashes independently — one broken widget can no longer take down the whole dashboard.',
          'Clock widget can now toggle between analog and digital display; preference is saved locally.',
          'Bookmarks — error message shown when a save or delete fails; javascript: URLs are blocked; input length limits enforced.',
          'Milestones — error feedback shown on save failures; title and note inputs now have character limits.',
        ],
      },
      {
        title: 'App & Navigation',
        color: 'purple',
        items: [
          'Pages show an animated loading screen instead of a blank flash while loading.',
          '404 page added — unknown URLs now show a styled not-found page instead of redirecting to home.',
          'Dark mode preference and layout lock state now persist across hard refreshes.',
        ],
      },
      {
        title: 'Bug Fixes',
        color: 'gray',
        items: [
          'Signing out now fully clears all widget data — no stale data from a previous account can bleed into a new session.',
          'XP awards are now server-validated — the server decides how much XP each action earns.',
          'Multiple overlapping sheets (e.g. opening two bottom sheets) no longer prematurely re-enable page scroll when one closes.',
          'Tag renames now propagate to all existing events, with a rollback if any update fails.',
          'Task order no longer reads stale snapshots when new events are added.',
          'Feedback modal now shows a 30-second cooldown after sending to prevent duplicate submissions.',
        ],
      },
    ],
  },
  {
    version: '1.4.0',
    label: 'Dark Mode Everywhere',
    date: 'March 20, 2026',
    description: 'Dark mode now works across every page — landing, changelog, terms, and more. Popovers no longer drift on scroll, and a handful of quality-of-life improvements land across tasks, calendar, and widgets.',
    sections: [
      {
        title: 'Dark Mode',
        color: 'blue',
        items: [
          'Dark mode toggle added to the landing page navbar — controls the theme globally across all pages',
          'Landing page, changelog, terms, and privacy pages all fully support dark mode',
          'Dashboard image in the hero switches to a dark variant when dark mode is active',
          'Default theme is now light mode for new users',
        ],
      },
      {
        title: 'Improvements',
        color: 'accent',
        items: [
          'All popovers now track their anchor element on scroll — no more floating away from where you clicked',
          'Add task and add event forms are more spacious — Cancel button added, color picker on its own row',
          'Start date field added to the Add Task form',
          'Calendar day popover no longer overflows off-screen on short viewports',
          'Social sharing previews (Open Graph + Twitter Card) added for link embeds on Discord, Slack, iMessage, etc.',
        ],
      },
      {
        title: 'Bug Fixes',
        color: 'gray',
        items: [
          'Milestone widget no longer resets to a tall height after signing out and back in',
          'Faint lighter background no longer visible behind the dashboard when widgets are made very tall',
          'Tag colors now save correctly to Supabase on create and update',
        ],
      },
    ],
  },
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
