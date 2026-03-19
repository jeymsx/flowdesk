import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getLeaderboard } from '../services/leaderboard';
import { computeLevel, getLevelTitle } from '../store/gamificationStore';
import { useAuthStore } from '../store/authStore';

export default function LeaderboardModal({ onClose }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-accent-500" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🏆</span> Leaderboard
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Top users ranked by XP earned</p>
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

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">🏅</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No rankings yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Complete tasks to earn XP and appear here!</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {entries.map((entry, i) => {
                const { level } = computeLevel(entry.xp);
                const title = getLevelTitle(level);
                const isMe = entry.id === currentUserId;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isMe
                        ? 'bg-accent-500/10 border border-accent-500/20'
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="w-6 text-center shrink-0 text-sm">
                      {medal ?? <span className="text-xs font-bold text-gray-400">#{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-accent-600 dark:text-accent-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {entry.username}
                        {isMe && <span className="ml-1.5 text-[10px] font-medium text-accent-400">(you)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Lv. {level} · {title}</p>
                    </div>
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${isMe ? 'text-accent-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {entry.xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
