import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const FAQ_DATA = [
  {
    section: "General",
    questions: [
      {
        q: "What is Flowdesk?",
        a: "Flowdesk is a customizable personal dashboard designed to help you organize your digital workspace. You can drag and drop widgets for tasks, notes, calendars, and focus timers to build a setup that works for you."
      },
      {
        q: "Is Flowdesk free to use?",
        a: "Yes! Flowdesk is currently free for all users. You can create an account, save multiple layouts, and access all our core widgets without any subscription fees."
      }
    ]
  },
  {
    section: "Account & Data",
    questions: [
      {
        q: "How is my data stored?",
        a: "We use Supabase for secure data storage. Your profile, tasks, and layouts are stored in a PostgreSQL database with Row Level Security (RLS) to ensure only you can access your information."
      },
      {
        q: "Are my notes private?",
        a: "Absolutely. Flowdesk includes a dedicated encryption layer for notes. When you create a note, it can be encrypted before it ever leaves your browser, meaning even we can't read the content without your key."
      },
      {
        q: "Can I delete my account?",
        a: "Yes. You can find the 'Delete Account' option in your Profile settings. This will permanently remove all your data, including tasks, notes, and saved layouts."
      }
    ]
  },
  {
    section: "Features",
    questions: [
      {
        q: "How do I add new widgets?",
        a: "Open the sidebar and expand the 'Widgets' section. You can toggle widgets on and off. Once visible, you can drag them to reposition or use the handle to resize them."
      },
      {
        q: "How do I save a custom layout?",
        a: "After arranging your widgets exactly how you like them, go to the 'Saved Layouts' section in the sidebar, click 'Save current layout', and give it a name. You can switch between different layouts for work, study, or relaxation."
      },
      {
        q: "How does the gamification system work?",
        a: "You earn XP for completing tasks and finishing focus sessions. As you earn XP, you'll level up and unlock new titles. Maintaining a daily streak also provides bonus rewards!"
      }
    ]
  },
  {
    section: "Troubleshooting",
    questions: [
      {
        q: "The dashboard layout looks broken on my phone.",
        a: "Flowdesk uses a specialized 'Mobile View' for smaller screens. If a layout looks cramped, try resetting the layout from the settings menu or using one of the mobile-optimized default layouts."
      },
      {
        q: "Why isn't my focus timer syncing across devices?",
        a: "For performance and accuracy, focus timers run locally in your browser session. While your XP and history sync to your account, an active timer cannot be 'handed off' to another device mid-session."
      }
    ]
  }
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200/60 dark:border-gray-800/60 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left transition-colors group"
      >
        <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-accent-500' : 'text-gray-900 dark:text-white group-hover:text-accent-500'}`}>
          {question}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent-500' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [openId, setOpenId] = useState(null);
  const navigate = useNavigate();

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

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

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Everything you need to know about setting up your Flowdesk workspace.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {FAQ_DATA.map((section, sIdx) => (
            <section key={section.section}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                {section.section}
              </h2>
              <div className="border-t border-gray-200 dark:border-gray-800">
                {section.questions.map((item, qIdx) => {
                  const id = `${sIdx}-${qIdx}`;
                  return (
                    <AccordionItem
                      key={id}
                      question={item.q}
                      answer={item.a}
                      isOpen={openId === id}
                      onToggle={() => toggle(id)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <footer className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            <Link to="/" className="hover:text-accent-500 transition-colors">Home</Link>
            <span>•</span>
            <Link to="/changelog" className="hover:text-accent-500 transition-colors">Changelog</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-accent-500 transition-colors">FAQ</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-accent-500 transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-accent-500 transition-colors">Privacy</Link>
          </nav>
          <p className="mt-6 text-[10px] font-medium text-gray-300 dark:text-gray-700 uppercase tracking-[0.2em]">
            © 2026 FlowDesk · Built for focus
          </p>
        </footer>
      </div>
    </div>
  );
}
