import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getLeaderboard } from '../services/leaderboard';
import { computeLevel, getLevelTitle } from '../store/gamificationStore';
import { useAuthStore } from '../store/authStore';

const LIMIT = 20;

export default function LeaderboardModal({ onClose }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef(null);

  const fetchEntries = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const nextOffset = isInitial ? 0 : offset;
      const data = await getLeaderboard(LIMIT, nextOffset);

      if (isInitial) {
        setEntries(data);
      } else {
        setEntries((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === LIMIT);
      setOffset(nextOffset + data.length);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  // Initial load
  useEffect(() => {
    fetchEntries(true);
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingMore && hasMore) {
      fetchEntries(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-accent-500 to-yellow-600 shrink-0" />
        
        <div className="p-5 flex flex-col h-full min-h-0">
          <div className="flex items-start justify-between mb-4 shrink-0">
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

          <div 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar"
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-2xl mb-2">🏅</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No rankings yet</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 text-center px-4">
                  Complete tasks to earn XP and appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 pb-2">
                {entries.map((entry, i) => {
                  const { level } = computeLevel(entry.xp);
                  const title = getLevelTitle(level);
                  const isMe = entry.id === currentUserId;
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  
                  return (
                    <div
                      key={entry.id + i}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isMe
                          ? 'bg-accent-500/10 ring-1 ring-accent-500/30'
                          : 'bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="w-6 text-center shrink-0 text-sm">
                        {medal ?? <span className="text-[10px] font-bold text-gray-400/80">#{i + 1}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isMe ? 'text-accent-600 dark:text-accent-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {entry.username}
                          {isMe && <span className="ml-1.5 text-[9px] font-black uppercase bg-accent-500 text-white px-1 rounded-sm tracking-tighter">You</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Lv. {level} · {title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black tabular-nums ${isMe ? 'text-accent-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {entry.xp.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 block leading-none">XP</span>
                      </div>
                    </div>
                  );
                })}
                
                {loadingMore && (
                  <div className="py-4 flex justify-center">
                    <div className="w-5 h-5 border-2 border-accent-500/20 border-t-accent-500 rounded-full animate-spin" />
                  </div>
                )}
                
                {!loadingMore && hasMore && (
                  <button 
                    onClick={() => fetchEntries(false)}
                    className="w-full py-2 text-[11px] font-bold text-gray-400 hover:text-accent-500 transition-colors uppercase tracking-widest"
                  >
                    Load More
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
