import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

const VERSION = 'v1.0.0';

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

// Unified Logo Component
const LogoIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-accent-100 selection:text-accent-900 antialiased">
      
      {/* ── Nav ── */}
      <header className="border-b border-gray-100/50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-accent-500 rounded-md flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <LogoIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-medium text-gray-900 tracking-tight">FlowDesk</span>
          </div>
          
          <nav className="flex items-center gap-3">
            <Link
              to="/changelog"
              className="hidden sm:block px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Changelog
            </Link>
            {user ? (
              <button
                onClick={() => navigate('/app')}
                className="ml-2 px-5 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-lg transition-all"
              >
                Open dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-lg shadow-sm hover:shadow transition-all"
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
        {/* Very subtle background blur to add depth without overpowering */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gray-50/50 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div 
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 text-gray-500 text-xs font-medium uppercase tracking-widest mb-8 bg-white shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            Personal productivity dashboard
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl font-light text-gray-900 leading-[1.15] tracking-tight mb-6 text-balance">
            Everything you need to <span className="text-accent-500 font-medium">stay on top</span> of your day.
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-2xl mx-auto text-balance">
            FlowDesk brings your tasks, calendar, notes, focus timer, and more into one flexible workspace. Arrange the widgets however you want. 
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/app')}
                className="w-full sm:w-auto px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"
              >
                Go to your dashboard &rarr;
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"
                >
                  Create a free account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-all"
                >
                  View demo
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
          <div className="rounded-xl border border-gray-200/60 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Mac-style Window Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
            </div>
            
            {/* The Image Viewer */}
            <div className="bg-gray-50 relative overflow-hidden border-t border-gray-100/50">
               <img 
                 src="/anchor.png" 
                 alt="FlowDesk Dashboard Preview" 
                 className="w-full h-auto block shadow-sm"
               />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 border-t border-gray-100 bg-gray-50/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="mb-16 md:text-center"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4 tracking-tight">Everything in its right place.</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto">Eight purposeful widgets designed to work together, so you can stop switching tabs and start focusing.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:border-accent-200 hover:shadow transition-all group flex flex-col gap-4"
              >
                <div className="w-8 h-8 rounded text-gray-400 group-hover:text-accent-500 transition-colors flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{f.description}</p>
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
              <h2 className="text-3xl font-light text-gray-900 mb-4 tracking-tight">Designed for flow.</h2>
              <p className="text-lg text-gray-500 font-light leading-relaxed">
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
                  <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-medium shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1.5">{p.title}</h3>
                    <p className="text-sm text-gray-500 font-light leading-relaxed">{p.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center relative z-10"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4 tracking-tight">Ready to get organised?</h2>
            <p className="text-gray-500 font-light mb-10">
              Join thousands of people bringing clarity to their workday. Free to use. No credit card required.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"
            >
              Create your free account
            </button>
          </motion.div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6 bg-white mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
               <LogoIcon className="w-4 h-4" />
               <span className="text-sm font-medium text-gray-900">FlowDesk</span>
            </div>
            <span className="text-gray-200">|</span>
            <Link to="/changelog" className="text-xs text-gray-400 hover:text-gray-900 transition-colors font-medium">
              {VERSION}
            </Link>
          </div>
          <nav className="flex items-center gap-8 text-xs text-gray-400">
            <Link to="/changelog" className="hover:text-gray-900 transition-colors">Changelog</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}