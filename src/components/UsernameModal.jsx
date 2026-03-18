import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useUIStore } from '../store/uiStore';
import { createPortal } from 'react-dom';

const MAX_LEN = 24;
const VALID_RE = /^[a-zA-Z0-9_-]+$/;

function validate(value) {
  if (!value) return null;
  if (value.length < 2) return 'At least 2 characters';
  if (!VALID_RE.test(value)) return 'Letters, numbers, _ and - only';
  return 'ok';
}

export default function UsernameModal() {
  const user = useAuthStore((s) => s.user);
  const { updateUsername, profile } = useProfileStore();
  const setShowUsernameModal = useUIStore((s) => s.setShowUsernameModal);

  const isChange = !!(profile?.username);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const status = validate(username.trim());
  const isValid = status === 'ok';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!isValid) return;
    setError('');
    setLoading(true);
    try {
      await updateUsername(user.id, trimmed);
      setShowUsernameModal(false);
    } catch (err) {
      setError(err.message?.includes('unique') ? 'That username is already taken' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const close = () => setShowUsernameModal(false);

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4"
      onClick={isChange ? close : undefined}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />

        <div className="p-6 space-y-5">
          {/* Close */}
          {isChange && (
            <button
              onClick={close}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isChange ? 'Change username' : 'Choose a username'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isChange
                  ? 'Your display name across FlowDesk'
                  : 'Pick a name to display on your FlowDesk'}
              </p>
            </div>
          </div>

          {/* Current username chip */}
          {isChange && profile.username && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">Current:</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                @{profile.username}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-base select-none">@</span>
                <input
                  autoFocus
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, MAX_LEN))}
                  placeholder="your_username"
                  className="w-full pl-8 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent font-medium text-base transition-all"
                />
                {/* Valid check icon */}
                {isValid && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                {/* Inline validation hint */}
                {status && status !== 'ok' && username.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {status && status !== 'ok' && username.trim()
                    ? <span className="text-red-400">{status}</span>
                    : 'Letters, numbers, _ and - only'}
                </p>
                <p className={`text-[11px] tabular-nums ${username.length >= MAX_LEN ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {username.length}/{MAX_LEN}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-3 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : (
                isChange ? 'Save changes' : 'Set username'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
