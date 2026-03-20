import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { motion } from 'framer-motion';

const VERSION = 'v1.4.0';

const FEATURES = [
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Calendar',
    description: 'A mini calendar on your dashboard and a fullscreen view when you need it. Click any day to add events, see what\'s coming, and keep multi-day tasks in sight.',
  },
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    title: 'Tasks',
    description: 'Filter by today, upcoming, or past. Drag to reorder. Assign colors, tags, and due dates. A progress bar keeps your daily completion visible at a glance.',
  },
  {
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    title: 'Notes',
    description: 'A persistent freeform editor that saves as you type. Capture thoughts, meeting notes, or anything that needs to stay close to your work.',
  },
  {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Focus Timer',
    description: 'A Pomodoro-style countdown with a visual ring. Set your session and break lengths, start the timer, and let the streak build.',
  },
  {
    icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
    title: 'Bookmarks',
    description: 'Save links with annotations and folder labels. Switch between list and card view. Star the ones you reach for often — they float to the top.',
  },
  {
    icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2',
    title: 'Milestones',
    description: 'Track longer-term goals alongside your daily work. Set a target date, log progress, and keep the bigger picture from slipping out of view.',
  },
  {
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    title: 'Music',
    description: 'An embedded music player with curated playlists or your own YouTube link. Keep the right atmosphere without leaving your workspace.',
  },
  {
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    title: 'Tags',
    description: 'Build a personal tag library once. Select tags when adding any task — from the widget, the calendar, or the sidebar. No retyping.',
  },
];

const GAMIFICATION_FEATURES = [
  {
    icon: '⚡',
    title: 'XP & Levels',
    description: 'Earn XP for every task you complete, every focus session you finish, and every streak milestone you hit. Level up and unlock new titles as you build better habits.',
  },
  {
    icon: '🎯',
    title: 'Daily Challenges',
    description: 'Three fresh challenges every day — complete a certain number of tasks, run a focus session, or keep your streak alive. Bonus XP for each one you knock out.',
  },
  {
    icon: '🔥',
    title: 'Streak Milestones',
    description: 'Keep your streak going for 7, 30, or 100 consecutive days to unlock milestone badges and earn bonus XP. An at-risk warning appears if you haven\'t completed anything yet today.',
  },
  {
    icon: '🏆',
    title: 'Leaderboard',
    description: 'See how you stack up against other FlowDesk users. Rankings are based on total XP earned — climb the board by staying consistent and completing challenges.',
  },
];

const PRINCIPLES = [
  {
    title: 'Your layout, your rules',
    description: 'Every widget is draggable and resizable. Save multiple named layouts and switch between them in one click.',
  },
  {
    title: 'Synced, not siloed',
    description: 'Your data lives in your account and stays in sync across every device you sign in to.',
  },
  {
    title: 'Installs like an app',
    description: 'FlowDesk is a Progressive Web App. Add it to your home screen or desktop and use it without a browser tab.',
  },
];

// Framer Motion Variants
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Feature card with cursor glow
function FeatureCard({ f, variants }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      variants={variants}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-accent-200 dark:hover:border-accent-800 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col gap-4 overflow-hidden"
    >
      {/* Cursor glow */}
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

// Unified Logo Component
const LogoIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

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
            <Link
              to="/changelog"
              className="hidden sm:block px-3 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
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
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-b from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-16 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent-100/40 dark:bg-accent-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-blue-100/20 dark:bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[250px] h-[250px] bg-purple-100/20 dark:bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
        
        <motion.div 
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-widest mb-8 bg-white dark:bg-gray-900 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            Personal productivity dashboard
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl font-light text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-6 text-balance">
            One system for <span className="text-accent-500 font-medium">everything</span> you need to get things done.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed mb-8 max-w-2xl mx-auto text-balance">
            Replace your scattered tabs and tools with a single, customizable workspace. Tasks, calendar, notes, timer, bookmarks — all connected, all in one place.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-2 mb-10">
            {[
              'Fully customizable layout',
              'Everything in one workspace',
              'Built-in focus and motivation system',
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
                  Get started for free
                </button>
                <button
                  onClick={() => navigate('/demo')}
                  className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg transition-all hover:-translate-y-0.5"
                >
                  Try it out
                </button>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Hero Dashboard Mockup - With Real App Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mt-24 max-w-5xl w-full mx-auto relative z-10"
        >
          {/* Glow behind the mockup */}
          <div className="absolute -inset-x-8 -top-8 -bottom-4 bg-gradient-to-b from-accent-200/50 via-accent-100/30 to-transparent blur-2xl rounded-3xl pointer-events-none" />
          <div className="absolute -inset-x-16 -top-12 h-40 bg-gradient-to-r from-blue-200/20 via-accent-200/30 to-purple-200/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Mac-style Window Header */}
            <div className="bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300/70" />
              </div>
            </div>

            {/* The Image Viewer */}
            <div className="bg-gray-50 dark:bg-gray-900 relative overflow-hidden border-t border-gray-100/50 dark:border-gray-800/50 select-none">
              <img
                src={darkMode ? '/anchor-dark.png' : '/anchor.png'}
                alt="FlowDesk Dashboard Preview"
                className="w-full h-auto block pointer-events-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              {/* Transparent overlay to block right-click / drag-save */}
              <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">How it works</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light max-w-xl mx-auto">Set up your workspace in minutes and build a daily routine that actually sticks.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {[
              { step: '1', title: 'Add your tasks, notes, and goals', description: 'Drop in your tasks, jot down notes, and set milestones — everything you need to track in one place.' },
              { step: '2', title: 'Arrange your workspace your way', description: 'Drag and resize widgets until the layout fits how you think. Save multiple layouts and switch instantly.' },
              { step: '3', title: 'Stay consistent with focus and streaks', description: 'Use the focus timer to work in sessions, earn XP, and keep your daily streak alive with challenges.' },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="flex flex-col items-center text-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent-50 dark:bg-accent-900/20 border border-accent-100 dark:border-accent-800/50 flex items-center justify-center text-accent-600 dark:text-accent-400 text-sm font-medium shrink-0">
                  {item.step}
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
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="mb-16 md:text-center"
          >
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Every part of your system, in one place.</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">Eight purposeful widgets built to work together as a single system — not a collection of disconnected tools.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
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
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="mb-16 md:text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-widest mb-6 bg-white dark:bg-gray-900 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Stay motivated
            </div>
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Built to keep you coming back.</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">FlowDesk rewards consistency. Earn XP, complete daily challenges, hit streak milestones, and see how you compare with others.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
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
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Designed for flow.</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                We believe your tools should adapt to your workflow, not the other way around. FlowDesk is built on a few core ideas to keep you moving forward.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="flex flex-col gap-10"
            >
              {PRINCIPLES.map((p, i) => (
                <motion.div key={i} variants={fadeUp} className="flex gap-5">
                  <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">
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
        <section className="py-24 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center relative z-10"
          >
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">Start building your system today</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light mb-10">
              Your layout. Your widgets. Your workflow. Free to use — no credit card required.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-gradient-to-b from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              Get started for free
            </button>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 font-light">No setup. No complexity. Just start.</p>
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