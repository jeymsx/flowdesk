import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { submitFeedback } from '../services/feedback';

export default function FeedbackModal({ onClose }) {
  const user = useAuthStore((s) => s.user);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const onCooldown = Date.now() < cooldownUntil;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || onCooldown) return;
    setLoading(true);
    setError(null);
    try {
      await submitFeedback(user?.id || null, type, message.trim());
      setSent(true);
      setCooldownUntil(Date.now() + 30_000);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Send Feedback</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Report a bug or suggest an improvement</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Thanks for your feedback!</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We&apos;ll look into it soon.</p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                {[
                  { id: 'bug', label: '🐛 Bug Report' },
                  { id: 'suggestion', label: '💡 Suggestion' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      type === t.id
                        ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400 border border-accent-500/30'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'bug' ? 'Describe the bug you encountered…' : 'Share your idea or suggestion…'}
                rows={5}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
              />

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 dark:text-gray-600">Submitted directly to the developer</p>
                <button
                  type="submit"
                  disabled={loading || !message.trim() || onCooldown}
                  className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {loading ? 'Sending…' : onCooldown ? 'Sent' : 'Send'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
