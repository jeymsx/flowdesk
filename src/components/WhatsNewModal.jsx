import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { LATEST_RELEASE, COLOR_MAP, DOT_MAP } from '../data/changelog';

export default function WhatsNewModal({ onClose }) {
  const onCloseRef = useRef(onClose);
  const [step, setStep] = useState(0);
  const sections = LATEST_RELEASE.sections;
  const activeSection = sections[step];
  const isFirst = step === 0;
  const isLast = step === sections.length - 1;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'ArrowRight') setStep((current) => Math.min(current + 1, sections.length - 1));
      if (e.key === 'ArrowLeft') setStep((current) => Math.max(current - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections.length]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-accent-500 via-teal-500 to-blue-500" />

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-500">What&apos;s New</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                FlowDesk {LATEST_RELEASE.version}
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{LATEST_RELEASE.label}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Close updates"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {LATEST_RELEASE.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <button
                key={section.title}
                onClick={() => setStep(index)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  index === step
                    ? COLOR_MAP[section.color]
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${index === step ? DOT_MAP[section.color] : 'bg-gray-300 dark:bg-gray-600'}`} />
                {section.title}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/60 p-4 min-h-[280px] flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_MAP[activeSection.color]}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_MAP[activeSection.color]}`} />
                {activeSection.title}
              </span>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                {step + 1} / {sections.length}
              </span>
            </div>

            <ul className="space-y-2.5 flex-1">
              {activeSection.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              to="/changelog"
              onClick={onClose}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-accent-500 transition-colors"
            >
              Full changelog
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                disabled={isFirst}
                className="px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                Back
              </button>
              {isLast ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setStep((current) => Math.min(current + 1, sections.length - 1))}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white text-sm font-semibold transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
