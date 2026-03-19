import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export default function DemoSignupPrompt({ onClose }) {
  const navigate = useNavigate();

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />

        <div className="p-6">
          {/* Close */}
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-accent-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              This widget requires an account
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign up free — no credit card required.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => go('/signup')}
              className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Create free account
            </button>
            <button
              onClick={() => go('/login')}
              className="w-full py-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
