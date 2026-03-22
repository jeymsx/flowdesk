import { Link, useNavigate } from 'react-router-dom';
import { RELEASES, COLOR_MAP, DOT_MAP } from '../data/changelog';

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
          <div className="absolute left-[7px] top-2 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
          <div>
            {RELEASES.map((release, idx) => (
              <div key={release.version} className={`relative pl-8 ${idx > 0 ? 'pt-12 mt-12 border-t border-gray-200 dark:border-gray-800' : ''}`}>
                <div className={`absolute left-0 w-3.5 h-3.5 rounded-full bg-accent-500 ring-4 ring-gray-50 dark:ring-gray-950 ${idx > 0 ? 'top-[49px]' : 'top-1.5'}`} />
                <div className="flex flex-wrap items-baseline gap-2.5 mb-1">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">v{release.version}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20">
                    {release.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{release.date}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{release.description}</p>
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
