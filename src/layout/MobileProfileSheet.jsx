import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useWidgetStore } from '../store/widgetStore';
import { useEventsStore } from '../store/eventsStore';
import { useGamificationStore, computeLevel, getLevelTitle } from '../store/gamificationStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import BottomSheet from './BottomSheet';
import ConfirmModal from '../components/ConfirmModal';
import DailyChallenges from '../components/gamification/DailyChallenges';
import WeeklyRecapModal from '../components/gamification/WeeklyRecapModal';
import LeaderboardModal from '../components/LeaderboardModal';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shiftDate(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
function computeStreak(events) {
  const completedDates = new Set(events.filter((e) => e.completed).map((e) => e.start_date));
  const today = toDateStr(new Date());
  let streak = 0;
  let d = completedDates.has(today) ? today : shiftDate(today, -1);
  while (completedDates.has(d)) { streak++; d = shiftDate(d, -1); }
  return streak;
}

export default function MobileProfileSheet() {
  const { showMobileProfile, setShowMobileProfile, darkMode, toggleDarkMode, layoutLocked, toggleLayoutLocked, setShowUsernameModal } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { profile } = useProfileStore();
  const { savedLayouts, activeSavedLayoutId, applySavedLayout, renameSavedLayout, deleteSavedLayout, saveCurrentLayout, resetLayout } = useWidgetStore();
  const { canInstall, install } = usePWAInstall();

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { xp, loaded: gamLoaded } = useGamificationStore();
  const { level, xpInLevel, xpToNext } = computeLevel(xp);
  const levelTitle = getLevelTitle(level);
  const events = useEventsStore((s) => s.events);
  const streak = computeStreak(events);
  const today = toDateStr(new Date());
  const todayEvents = events.filter((e) => {
    const end = e.end_date || e.start_date;
    return e.start_date <= today && end >= today;
  });
  const todayDone = todayEvents.filter((e) => e.completed).length;
  const todayTotal = todayEvents.length;

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = displayName[0]?.toUpperCase() ?? '?';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const handleSignOut = () => {
    setShowMobileProfile(false);
    signOut();
  };

  return (
    <>
      <BottomSheet
        open={showMobileProfile}
        onClose={() => setShowMobileProfile(false)}
        title="Profile"
        maxHeight="90vh"
      >
        <div className="px-4 py-3 space-y-1 pb-8">
          {/* User info */}
          <div className="flex items-center gap-4 px-4 py-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initial}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{displayName}</p>
              {user?.email && <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>}
              {memberSince && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Member since {memberSince}</p>}
            </div>
          </div>

          {/* Change username */}
          <button
            onClick={() => { setShowUsernameModal(true); setShowMobileProfile(false); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Change username</span>
          </button>

          {/* Divider */}
          <div className="pt-1 pb-1 border-t border-gray-100 dark:border-gray-800 mx-2" />

          {/* Progress / Gamification */}
          {gamLoaded && (
            <div className="px-1">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Progress</p>

              {/* XP bar */}
              <button
                onClick={() => setShowWeeklyRecap(true)}
                className="w-full px-3 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Level {level}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{levelTitle}</span>
                  </div>
                  <span className="text-sm font-semibold text-accent-500">{xp} XP</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-500"
                    style={{ width: `${(xpInLevel / xpToNext) * 100}%`, boxShadow: '0 0 6px rgba(34,197,94,0.5)' }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View weekly recap →</p>
              </button>

              {/* Streak + tasks */}
              {(streak > 0 || todayTotal > 0) && (
                <div className="px-3 py-1 flex gap-4">
                  {streak > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 text-accent-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{streak}d streak</span>
                    </div>
                  )}
                  {todayTotal > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{todayDone}/{todayTotal} tasks</span>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Challenges */}
              <div className="px-3 py-2">
                <DailyChallenges collapsed={false} />
              </div>

              {/* Leaderboard button */}
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leaderboard</span>
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="pt-1 pb-1 border-t border-gray-100 dark:border-gray-800 mx-2" />

          {/* Saved layouts */}
          <div className="px-1">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Saved Layouts</p>
            {savedLayouts.map((sl) => (
              <div key={sl.id} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800">
                {editingId === sl.id ? (
                  <form
                    className="flex-1 flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editingName.trim()) renameSavedLayout(sl.id, editingName.trim());
                      setEditingId(null);
                    }}
                  >
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => { if (editingName.trim()) renameSavedLayout(sl.id, editingName.trim()); setEditingId(null); }}
                      onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                      className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-accent-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    />
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => applySavedLayout(sl.id)}
                      className="flex-1 flex items-center gap-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {activeSavedLayoutId === sl.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />
                      )}
                      <span className="truncate">{sl.name}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingId(sl.id); setEditingName(sl.name); }}
                        className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(sl.id)}
                        className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Save current */}
            {showSaveInput ? (
              <form
                className="flex items-center gap-2 px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (savingName.trim()) {
                    saveCurrentLayout(savingName.trim());
                    setSavingName('');
                    setShowSaveInput(false);
                  }
                }}
              >
                <input
                  autoFocus
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onBlur={() => { if (!savingName.trim()) setShowSaveInput(false); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowSaveInput(false); setSavingName(''); } }}
                  placeholder="Layout name…"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-accent-400"
                />
                <button
                  type="submit"
                  disabled={!savingName.trim()}
                  className="px-3 py-2 text-sm rounded-xl bg-accent-500 text-white disabled:opacity-40"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-accent-500 hover:bg-accent-500/10 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Save current layout
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="pt-1 pb-1 border-t border-gray-100 dark:border-gray-800 mx-2" />

          {/* Lock toggle */}
          <button
            onClick={toggleLayoutLocked}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className={`w-5 h-5 shrink-0 ${layoutLocked ? 'text-accent-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={layoutLocked
                ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'}
              />
            </svg>
            <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              {layoutLocked ? 'Unlock widgets' : 'Lock widgets in place'}
            </span>
            <div className={`w-11 h-6 rounded-full transition-colors ${layoutLocked ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 shadow-sm transition-transform ${layoutLocked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={darkMode
                ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'}
              />
            </svg>
            <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              {darkMode ? 'Light mode' : 'Dark mode'}
            </span>
            <div className={`w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Install app */}
          <button
            onClick={() => {
              if (canInstall) install();
              else alert('Open browser menu → "Install FlowDesk" to install as an app.');
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Install App</span>
          </button>

          {/* Reset Layout */}
          <button
            onClick={() => { resetLayout(); setShowMobileProfile(false); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset Layout</span>
          </button>

          {/* Divider */}
          <div className="pt-1 pb-1 border-t border-gray-100 dark:border-gray-800 mx-2" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium text-red-500 dark:text-red-400">Sign Out</span>
          </button>

          <div style={{ height: 'max(env(safe-area-inset-bottom), 12px)' }} />
        </div>
      </BottomSheet>

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete saved layout"
          message={`"${savedLayouts.find((s) => s.id === confirmDeleteId)?.name}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => { deleteSavedLayout(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {showWeeklyRecap && <WeeklyRecapModal onClose={() => setShowWeeklyRecap(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </>
  );
}
