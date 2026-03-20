import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useWidgetStore } from '../store/widgetStore';
import { useEventsStore } from '../store/eventsStore';
import { useTagsStore } from '../store/tagsStore';
import { useGamificationStore, computeLevel, getLevelTitle } from '../store/gamificationStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { RELEASES, COLOR_MAP, DOT_MAP } from '../data/changelog';
import { supabase } from '../services/supabase';
import { checkUsernameAvailable } from '../services/profiles';
import { useShallow } from 'zustand/react/shallow';
import { checkIsAdmin } from '../services/admin';
import ConfirmModal from '../components/ConfirmModal';
import TagSelector from '../components/TagSelector';
import DemoSignupPrompt from '../components/DemoSignupPrompt';
import DailyChallenges from '../components/gamification/DailyChallenges';
import WeeklyRecapModal from '../components/gamification/WeeklyRecapModal';
import FeedbackModal from '../components/FeedbackModal';
import LeaderboardModal from '../components/LeaderboardModal';
import HexPickerBtn from '../components/HexPickerBtn';

const EVENT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

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

const WIDGET_ICONS = {
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  notes: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  focus: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  music: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  streak: 'M13 10V3L4 14h7v7l9-11h-7z',
  milestones: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2',
  bookmarks: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
};

function Icon({ d, size = 5 }) {
  return (
    <svg className={`w-${size} h-${size} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function SidebarBtn({ icon, label, collapsed, onClick, danger = false, highlight = false }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
        highlight
          ? 'text-accent-600 dark:text-accent-400 hover:bg-accent-500/10'
          : danger
          ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon d={icon} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

// Row used inside the user menu popover
function MenuRow({ iconD, label, onClick, danger = false, hasChevron = false, badge = null, isOpen = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconD} />
      </svg>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-accent-500 text-white leading-none">{badge}</span>
      )}
      {hasChevron && (
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, layoutLocked, toggleLayoutLocked, setShowUsernameModal, focusRunning, musicActive, setLeaveGuardPending, isDemo, exitDemo } = useUIStore(
    useShallow((s) => ({
      sidebarOpen: s.sidebarOpen,
      toggleSidebar: s.toggleSidebar,
      darkMode: s.darkMode,
      toggleDarkMode: s.toggleDarkMode,
      layoutLocked: s.layoutLocked,
      toggleLayoutLocked: s.toggleLayoutLocked,
      setShowUsernameModal: s.setShowUsernameModal,
      focusRunning: s.focusRunning,
      musicActive: s.musicActive,
      setLeaveGuardPending: s.setLeaveGuardPending,
      isDemo: s.isDemo,
      exitDemo: s.exitDemo,
    }))
  );
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const { profile, updateUsername } = useProfileStore(
    useShallow((s) => ({ profile: s.profile, updateUsername: s.updateUsername }))
  );
  const { allWidgets, visibleWidgetIds, toggleWidget, resetLayout, savedLayouts, activeSavedLayoutId, saveCurrentLayout, applySavedLayout, renameSavedLayout, deleteSavedLayout } = useWidgetStore(
    useShallow((s) => ({
      allWidgets: s.allWidgets,
      visibleWidgetIds: s.visibleWidgetIds,
      toggleWidget: s.toggleWidget,
      resetLayout: s.resetLayout,
      savedLayouts: s.savedLayouts,
      activeSavedLayoutId: s.activeSavedLayoutId,
      saveCurrentLayout: s.saveCurrentLayout,
      applySavedLayout: s.applySavedLayout,
      renameSavedLayout: s.renameSavedLayout,
      deleteSavedLayout: s.deleteSavedLayout,
    }))
  );
  const { canInstall, install } = usePWAInstall();

  const events = useEventsStore((s) => s.events);
  const addEvent = useEventsStore((s) => s.addEvent);
  const { tags, addTag, load: loadTags } = useTagsStore(
    useShallow((s) => ({ tags: s.tags, addTag: s.addTag, load: s.load }))
  );

  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [layoutsOpen, setLayoutsOpen] = useState(true);
  const [progressOpen, setProgressOpen] = useState(true);
  const [savingName, setSavingName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [warnFocusHide, setWarnFocusHide] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickEndDate, setQuickEndDate] = useState('');
  const [quickColor, setQuickColor] = useState(EVENT_COLORS[0]);
  const [quickTags, setQuickTags] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // User menu & profile states
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState('');
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  // 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'same' | 'error'
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameError, setUsernameError] = useState('');
  const usernameCheckRef = useRef(null);

  const { xp, loaded: gamLoaded } = useGamificationStore(
    useShallow((s) => ({ xp: s.xp, loaded: s.loaded }))
  );
  const { level, xpInLevel, xpToNext } = computeLevel(xp);
  const levelTitle = getLevelTitle(level);
  const saveInputRef = useRef(null);
  const addTaskBtnRef = useRef(null);
  const userBtnRef = useRef(null);
  const helpBtnRef = useRef(null);

  const today = toDateStr(new Date());
  const { todayDone, todayTotal, streak } = useMemo(() => {
    const todayEvts = events.filter((e) => {
      const end = e.end_date || e.start_date;
      return e.start_date <= today && end >= today;
    });
    return {
      todayDone: todayEvts.filter((e) => e.completed).length,
      todayTotal: todayEvts.length,
      streak: computeStreak(events),
    };
  }, [events, today]);

  useEffect(() => { if (user?.id) loadTags(user.id); }, [user?.id, loadTags]);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    checkIsAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [user]);

  useEffect(() => {
    if (!showProfile) return;
    const onKey = (e) => { if (e.key === 'Escape') { setShowProfile(false); cancelUsernameEdit(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProfile]);

  const closeQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickTitle('');
    setQuickDesc('');
    setQuickEndDate('');
    setQuickColor(EVENT_COLORS[0]);
    setQuickTags([]);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || !user?.id) return;
    setQuickLoading(true);
    try {
      await addEvent(user.id, title, today, quickEndDate || today, quickColor, quickDesc.trim(), quickTags);
      closeQuickAdd();
    } catch (err) {
      console.error(err);
    } finally {
      setQuickLoading(false);
    }
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = displayName[0]?.toUpperCase() ?? '?';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  // Debounced username availability check
  useEffect(() => {
    if (!editingUsername) return;
    const name = newUsername.trim();
    if (!name) { setUsernameStatus('idle'); return; }
    if (name === (profile?.username || displayName)) { setUsernameStatus('same'); return; }
    // Validate format: 3-20 chars, alphanumeric + underscores
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
      setUsernameStatus('invalid');
      setUsernameError(name.length < 3 ? 'At least 3 characters' : name.length > 20 ? 'Max 20 characters' : 'Letters, numbers, underscores only');
      return;
    }
    setUsernameStatus('checking');
    clearTimeout(usernameCheckRef.current);
    let cancelled = false;
    usernameCheckRef.current = setTimeout(async () => { // 800ms — rate-limit the availability check
      try {
        const available = await checkUsernameAvailable(name, user?.id);
        if (cancelled) return;
        setUsernameStatus(available ? 'available' : 'taken');
        if (!available) setUsernameError('Username already taken');
      } catch {
        if (cancelled) return;
        setUsernameStatus('error');
        setUsernameError('Could not check availability');
      }
    }, 800);
    return () => { cancelled = true; clearTimeout(usernameCheckRef.current); };
  }, [newUsername, editingUsername, profile?.username, displayName, user?.id]);

  const handleUsernameSubmit = async (e) => {
    e?.preventDefault();
    const name = newUsername.trim();
    if (!name || !user?.id || usernameStatus !== 'available') return;
    setSavingUsername(true);
    try {
      await updateUsername(user.id, name);
      setEditingUsername(false);
      setUsernameStatus('idle');
    } catch (err) {
      // Postgres unique violation — username was taken despite the availability check
      // (most likely caused by RLS hiding other users' rows during the check)
      if (err?.code === '23505' || err?.message?.includes('unique')) {
        setUsernameStatus('taken');
        setUsernameError('Username already taken');
      } else {
        setUsernameStatus('error');
        setUsernameError('Failed to save. Try again.');
      }
    } finally {
      setSavingUsername(false);
    }
  };

  const openUsernameEdit = () => {
    setNewUsername(profile?.username || displayName || '');
    setUsernameStatus('idle');
    setUsernameError('');
    setEditingUsername(true);
  };

  const cancelUsernameEdit = () => {
    setEditingUsername(false);
    setUsernameStatus('idle');
    setUsernameError('');
    setNewUsername('');
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await supabase.rpc('delete_user');
    } catch {
      // RPC may not exist; sign out regardless
    } finally {
      setDeletingAccount(false);
      setDeleteConfirm(false);
      setDeleteTyped('');
      setShowProfile(false);
      await signOut();
      navigate('/');
    }
  };

  const closeUserMenu = () => { setShowUserMenu(false); setHelpOpen(false); };

  // Compute user menu popover position (above the user button)
  const getUserMenuPos = () => {
    if (!userBtnRef.current) return { bottom: 64, left: 12 };
    const rect = userBtnRef.current.getBoundingClientRect();
    return {
      bottom: window.innerHeight - rect.top + 8,
      left: sidebarOpen ? 12 : 68,
    };
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r transition-all duration-300 bg-gradient-to-b from-white to-gray-50/70 dark:from-gray-900 dark:to-gray-900 border-gray-200/80 dark:border-gray-800 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* ── Logo + Collapse toggle ── */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-gray-200 dark:border-gray-800">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <button onClick={() => { if (focusRunning || musicActive) { setLeaveGuardPending('/'); } else { navigate('/'); } }} className="flex items-center gap-2 group">
              <div className="w-6 h-6 bg-accent-500 rounded flex items-center justify-center shrink-0 group-hover:bg-accent-400 transition-colors">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <span className="text-base font-medium text-gray-900 dark:text-white tracking-tight group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors">
                FlowDesk
              </span>
            </button>
            {isDemo && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-500/10 text-accent-500 font-semibold border border-accent-500/20 leading-none">
                Demo
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {sidebarOpen && !isDemo && (
            <div className="relative group">
              <button
                onClick={toggleLayoutLocked}
                className={`p-1.5 rounded-lg transition-colors ${
                  layoutLocked
                    ? 'bg-accent-500/15 text-accent-500'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <Icon d={layoutLocked
                  ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'}
                />
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                  {layoutLocked ? 'Unlock widgets' : 'Lock widgets in place'}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Icon d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
          </button>
        </div>
      </div>

      {/* ── Quick-Add Task ── */}
      {!isDemo && (
        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <button
            ref={addTaskBtnRef}
            onClick={() => setShowQuickAdd(true)}
            title={!sidebarOpen ? 'Add task' : undefined}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-accent-200 dark:border-accent-500/25 text-accent-600 dark:text-accent-400 bg-accent-500/5 hover:bg-accent-500/10 hover:border-accent-400 dark:hover:border-accent-400 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {sidebarOpen && <span>Add task</span>}
          </button>
        </div>
      )}

      {/* ── Quick-Add Popover ── */}
      {!isDemo && showQuickAdd && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={closeQuickAdd}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
            style={{
              left: sidebarOpen ? 244 : 68,
              top: Math.min(
                addTaskBtnRef.current ? addTaskBtnRef.current.getBoundingClientRect().top : 300,
                window.innerHeight - 380
              ),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Task</h4>
                <button onClick={closeQuickAdd} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleQuickAdd} className="space-y-3">
                <input
                  autoFocus type="text" value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeQuickAdd()}
                  placeholder="Task title…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <textarea
                  value={quickDesc} onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="Description (optional)…" rows={2}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
                <TagSelector selected={quickTags} onChange={setQuickTags} tags={tags} onCreateTag={(name) => addTag(user.id, name)} />
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-medium">End date (optional)</label>
                  <input
                    type="date" value={quickEndDate} min={today}
                    onChange={(e) => setQuickEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                  />
                </div>
                <div className="flex gap-1.5 items-center">
                  {EVENT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setQuickColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{ backgroundColor: c, outline: quickColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                    />
                  ))}
                  <HexPickerBtn color={quickColor} onChange={setQuickColor} size="sm" presets={EVENT_COLORS} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={quickLoading || !quickTitle.trim()}
                    className="flex-1 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {quickLoading ? '…' : '+ Add'}
                  </button>
                  <button type="button" onClick={closeQuickAdd}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Scrollable middle ── */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 min-h-0">

        {/* Widgets section */}
        <div>
          <button
            onClick={() => setWidgetsOpen(!widgetsOpen)}
            title={!sidebarOpen ? 'Widgets' : undefined}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${widgetsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            )}
            {sidebarOpen && <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Widgets</span>}
          </button>

          <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: sidebarOpen && widgetsOpen ? '400px' : '0px' }}>
            <div className="pt-0.5 space-y-0.5">
              {allWidgets.map((widget) => {
                const visible = visibleWidgetIds.includes(widget.id);
                const demoLocked = isDemo && widget.id !== 'music-1' && widget.id !== 'focus-1' && widget.id !== 'clock-1';
                return (
                  <button
                    key={widget.id}
                    onClick={() => {
                      if (demoLocked) { setShowDemoPrompt(true); return; }
                      if (widget.id === 'focus-1' && visible && focusRunning) { setWarnFocusHide(true); return; }
                      toggleWidget(widget.id);
                    }}
                    title={!sidebarOpen ? (demoLocked ? `${widget.label} (sign up to unlock)` : `${widget.label} (${visible ? 'visible' : 'hidden'})`) : undefined}
                    className={`group w-full flex items-center gap-2 px-2.5 py-1 rounded-md transition-colors text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      demoLocked ? 'text-gray-400 dark:text-gray-600 opacity-60'
                        : visible ? 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="shrink-0 group-hover:text-accent-500 transition-colors">
                      <Icon d={WIDGET_ICONS[widget.type] || ''} size={4} />
                    </span>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{widget.label}</span>
                        {demoLocked ? (
                          <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {visible ? (
                              <>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </>
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            )}
                          </svg>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saved Layouts section */}
        {!isDemo && (
          <div className="mt-1">
            <button
              onClick={() => setLayoutsOpen(!layoutsOpen)}
              title={!sidebarOpen ? 'Saved Layouts' : undefined}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? (
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${layoutsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
              {sidebarOpen && (
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-1 text-left">Saved Layouts</span>
              )}
            </button>

            <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: sidebarOpen && layoutsOpen ? '600px' : '0px' }}>
              <div className="pt-0.5 space-y-0.5">
                {savedLayouts.map((sl) => (
                  <div key={sl.id} className="group flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    {editingId === sl.id ? (
                      <form className="flex-1 flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); if (editingName.trim()) renameSavedLayout(sl.id, editingName.trim()); setEditingId(null); }}>
                        <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => { if (editingName.trim()) renameSavedLayout(sl.id, editingName.trim()); setEditingId(null); }}
                          onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                          className="flex-1 text-xs px-1.5 py-0.5 rounded border border-accent-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none min-w-0"
                        />
                      </form>
                    ) : (
                      <>
                        <button onClick={() => applySavedLayout(sl.id)} title={sl.name}
                          className="flex-1 flex items-center gap-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 truncate min-w-0"
                        >
                          {activeSavedLayoutId === sl.id && <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />}
                          <span className="truncate">{sidebarOpen ? sl.name : <Icon d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 13a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />}</span>
                        </button>
                        {sidebarOpen && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => { setEditingId(sl.id); setEditingName(sl.name); }} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" title="Rename">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => setConfirmDeleteId(sl.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {sidebarOpen && (
                  showSaveInput ? (
                    <form className="flex items-center gap-1 px-2 py-1" onSubmit={(e) => { e.preventDefault(); if (savingName.trim()) { saveCurrentLayout(savingName.trim()); setSavingName(''); setShowSaveInput(false); } }}>
                      <input ref={saveInputRef} autoFocus value={savingName} onChange={(e) => setSavingName(e.target.value)}
                        onBlur={() => { if (!savingName.trim()) setShowSaveInput(false); }}
                        onKeyDown={(e) => { if (e.key === 'Escape') { setShowSaveInput(false); setSavingName(''); } }}
                        placeholder="Layout name…"
                        className="flex-1 text-xs px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-accent-400 min-w-0"
                      />
                      <button type="submit" disabled={!savingName.trim()} className="px-1.5 py-0.5 text-xs rounded bg-accent-500 text-white disabled:opacity-40 hover:bg-accent-600 transition-colors shrink-0">Save</button>
                    </form>
                  ) : (
                    <button onClick={() => setShowSaveInput(true)} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-500 hover:bg-accent-500/10 transition-colors">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Save current layout
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress block */}
        {(isDemo || gamLoaded) && (
          <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
            <button
              onClick={() => isDemo ? setShowDemoPrompt(true) : (sidebarOpen ? setProgressOpen(!progressOpen) : setShowWeeklyRecap(true))}
              title={!sidebarOpen ? (isDemo ? 'Progress (sign up to unlock)' : `Level ${level} · ${xp} XP`) : undefined}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? (
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${!isDemo && progressOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
              {sidebarOpen && <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-1 text-left">Progress</span>}
              {isDemo && sidebarOpen && (
                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>

            <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: sidebarOpen && (isDemo || progressOpen) ? '500px' : '0px' }}>
              <div className="relative pt-2 pb-2 px-1 rounded-xl bg-gray-50/70 dark:bg-gray-800/30 mt-0.5">
                {/* Demo placeholder content */}
                <div className={`space-y-3 ${isDemo ? 'select-none pointer-events-none' : ''}`}>
                  <div className="w-full px-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">Level {isDemo ? 3 : level}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">{isDemo ? 'Achiever' : levelTitle}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-accent-500">{isDemo ? 240 : xp} XP</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800/80">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-500"
                        style={{ width: isDemo ? '40%' : `${(xpInLevel / xpToNext) * 100}%`, boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
                    </div>
                  </div>

                  {(isDemo || streak > 0 || todayTotal > 0) && (
                    <div className="flex flex-col gap-1 px-1 mt-3">
                      {(isDemo || streak > 0) && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-xs">Streak</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{isDemo ? '5 days' : `${streak} day${streak !== 1 ? 's' : ''}`}</span>
                        </div>
                      )}
                      {(isDemo || todayTotal > 0) && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <span className="text-xs">Tasks done</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{isDemo ? '3/5' : `${todayDone}/${todayTotal}`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isDemo && <DailyChallenges collapsed={false} />}
                  {isDemo && (
                    <div className="px-1 mt-2 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Daily Challenges</span>
                      {[
                        { label: 'Complete 3 tasks', xp: '+10 XP' },
                        { label: 'Finish a focus session', xp: '+15 XP' },
                        { label: 'Log in for 7 days', xp: '+10 XP' },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded border border-gray-200 dark:border-gray-700 shrink-0" />
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex-1">{c.label}</span>
                          <span className="text-[10px] font-semibold text-accent-500">{c.xp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lock overlay for demo */}
                {isDemo && (
                  <div
                    className="absolute inset-0 z-10 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1.5 bg-gray-950/30 dark:bg-gray-950/50 backdrop-blur-[1px]"
                    onClick={() => setShowDemoPrompt(true)}
                  >
                    <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium text-white/80">Sign up to unlock</span>
                  </div>
                )}

                {!isDemo && (
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-xs">Leaderboard</span>
                    </div>
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ── Bottom: User button (or demo actions) ── */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 shrink-0 mt-1">
        {isDemo ? (
          <div className="space-y-0.5">
            <SidebarBtn
              icon={darkMode ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'}
              label={darkMode ? 'Light Mode' : 'Dark Mode'} collapsed={!sidebarOpen} onClick={toggleDarkMode}
            />
            <SidebarBtn icon="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              label="Exit Demo" collapsed={!sidebarOpen} onClick={() => { exitDemo(); navigate('/'); }}
            />
            <button onClick={() => navigate('/signup')} title={!sidebarOpen ? 'Sign up free' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-semibold bg-accent-500 hover:bg-accent-600 text-white ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {sidebarOpen && <span>Sign up free</span>}
            </button>
          </div>
        ) : (
          <button
            ref={userBtnRef}
            onClick={() => { setShowUserMenu(!showUserMenu); setHelpOpen(false); }}
            title={!sidebarOpen ? displayName : undefined}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {initial}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                  {user?.email && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── User menu popover (portal) ── */}
      {!isDemo && showUserMenu && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={closeUserMenu}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            style={{
              width: 256,
              ...getUserMenuPos(),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5 px-1.5 space-y-0.5">
              {/* Profile */}
              <MenuRow
                iconD="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                label="Profile"
                hasChevron
                onClick={() => { closeUserMenu(); setShowProfile(true); }}
              />

              {/* Help with nested popover */}
              <div ref={helpBtnRef}>
                <MenuRow
                  iconD="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  label="Help"
                  hasChevron
                  isOpen={helpOpen}
                  onClick={() => setHelpOpen(!helpOpen)}
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

              {/* Dark mode + Install */}
              <MenuRow
                iconD={darkMode ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'}
                label={darkMode ? 'Light Mode' : 'Dark Mode'}
                onClick={toggleDarkMode}
              />
              <MenuRow
                iconD="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                label="Install App"
                onClick={() => { closeUserMenu(); if (canInstall) install(); else alert('Open browser menu → "Install FlowDesk" to install as an app.'); }}
              />

              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

              {/* Account */}
              <MenuRow
                iconD="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                label="Reset Layout"
                onClick={() => { closeUserMenu(); resetLayout(); }}
              />
              {isAdmin && (
                <MenuRow
                  iconD="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  label="Admin"
                  onClick={() => { closeUserMenu(); navigate('/admin'); }}
                />
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

              <MenuRow
                iconD="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                label="Sign Out"
                danger
                onClick={() => { closeUserMenu(); setSignOutConfirm(true); }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Help nested popover (portal) ── */}
      {!isDemo && showUserMenu && helpOpen && createPortal(
        (() => {
          const rect = helpBtnRef.current?.getBoundingClientRect();
          if (!rect) return null;
          return (
            <div
              className="fixed z-[9992] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden py-1.5 px-1.5"
              style={{ width: 220, top: rect.top, left: rect.right + 8 }}
            >
              <MenuRow
                iconD="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                label="What's New"
                badge="v2.0"
                onClick={() => { closeUserMenu(); setShowChangelog(true); }}
              />
              <MenuRow
                iconD="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                label="Terms & Policies"
                onClick={() => { closeUserMenu(); navigate('/terms'); }}
              />
              <MenuRow
                iconD="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                label="Send Feedback"
                onClick={() => { closeUserMenu(); setShowFeedback(true); }}
              />
            </div>
          );
        })(),
        document.body
      )}

      {/* ── Profile modal (portal) ── */}
      {showProfile && createPortal(
        <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowProfile(false); cancelUsernameEdit(); }}>
          <div
            className="relative w-full max-w-xl h-[480px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-700/60 flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Left panel: identity + stats ── */}
            <div className="relative w-52 shrink-0 flex flex-col items-center pt-8 pb-6 px-4" style={{ background: 'linear-gradient(to bottom, #15803d, #166534, #14532d)' }}>
              {/* subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              <div className="relative w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-3xl font-black shadow-xl mb-3">
                {initial}
              </div>
              <h2 className="relative text-base font-bold text-white text-center leading-tight">{displayName}</h2>
              <p className="relative text-[11px] text-white/60 mt-0.5 text-center truncate w-full text-center">{user?.email}</p>
              <span className="relative mt-2 px-2.5 py-0.5 bg-white/15 border border-white/20 rounded-full text-[10px] font-semibold text-white/90 text-center">
                {levelTitle}
              </span>

              <div className="relative w-full mt-auto pt-4 space-y-2.5">
                <div className="h-px w-full bg-white/15" />
                {[
                  { label: 'Level', value: level, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-white', filled: true },
                  { label: 'XP', value: xp.toLocaleString(), icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', color: 'text-yellow-300', filled: true },
                  { label: 'Streak', value: `${streak}d`, icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', color: 'text-orange-300', filled: true },
                ].map(({ label, value, icon, color, filled }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className={`w-3.5 h-3.5 ${color} shrink-0`} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke={filled ? 'none' : 'currentColor'} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                      <span className="text-xs text-white/60">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right panel: info + username + danger ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Profile</span>
                <button
                  onClick={() => { setShowProfile(false); cancelUsernameEdit(); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content — expanding username form scrolls here, modal stays fixed */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

                {/* Info rows */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {[
                    { label: 'Member since', value: memberSince || '—', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { label: 'Tasks today', value: todayTotal > 0 ? `${todayDone} / ${todayTotal}` : '—', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                  ].map(({ label, value, icon }, i, arr) => (
                    <div key={label} className={`flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-900 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{label}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Username */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Username</span>
                    {!editingUsername && (
                      <button onClick={openUsernameEdit} className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
                        Change
                      </button>
                    )}
                    {editingUsername && (
                      <button onClick={cancelUsernameEdit} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                  {editingUsername ? (
                    <div className="px-4 py-3 space-y-2">
                      <div className="relative">
                        <input
                          autoFocus
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          onKeyDown={(e) => e.key === 'Escape' && cancelUsernameEdit()}
                          placeholder="New username…"
                          maxLength={20}
                          className={`w-full px-3 py-2 pr-9 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                            usernameStatus === 'available' ? 'border-green-400 focus:ring-green-400/30'
                            : usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error' ? 'border-red-400 focus:ring-red-400/30'
                            : 'border-gray-200 dark:border-gray-700 focus:ring-accent-500/30'
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && (
                            <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          )}
                          {usernameStatus === 'available' && (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {(usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error') && (
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] font-medium ${
                          usernameStatus === 'available' ? 'text-green-500'
                          : usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error' ? 'text-red-500'
                          : 'text-gray-400'
                        }`}>
                          {usernameStatus === 'available' && 'Available!'}
                          {usernameStatus === 'same' && 'Same as current.'}
                          {(usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error') && usernameError}
                          {(usernameStatus === 'idle' || usernameStatus === 'checking') && '3–20 chars · letters, numbers, _'}
                        </p>
                        <button
                          onClick={handleUsernameSubmit}
                          disabled={savingUsername || usernameStatus !== 'available'}
                          className="shrink-0 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          {savingUsername ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                        @{profile?.username || displayName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Danger zone */}
                <div className="rounded-xl border border-red-100 dark:border-red-900/40 overflow-hidden">
                  <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/40">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-red-500 dark:text-red-400">Danger zone</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-900">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">Delete account</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Permanently removes all your data</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="shrink-0 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Changelog right-side drawer (portal) ── */}
      {showChangelog && createPortal(
        <div className="fixed inset-0 z-[9990] flex justify-end" onClick={() => setShowChangelog(false)}>
          <div
            className="relative h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600 shrink-0" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Changelog</h2>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Every update shipped to FlowDesk</p>
              </div>
              <button onClick={() => setShowChangelog(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="relative">
                <div className="absolute left-[6px] top-2 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-0">
                  {RELEASES.map((release, idx) => (
                    <div key={release.version} className={`relative pl-7 pb-8 ${idx > 0 ? 'pt-8 mt-0 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                      <div className={`absolute left-0 w-3 h-3 rounded-full bg-accent-500 ring-4 ring-white dark:ring-gray-900 ${idx > 0 ? 'top-[33px]' : 'top-1'}`} />
                      <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">v{release.version}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20">{release.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">{release.date}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{release.description}</p>
                      <div className="space-y-4">
                        {release.sections.map((section) => (
                          <div key={section.title}>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2 ${COLOR_MAP[section.color]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_MAP[section.color]}`} />
                              {section.title}
                            </span>
                            <ul className="space-y-1.5 pl-0.5">
                              {section.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <svg className="w-3 h-3 mt-0.5 shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modals ── */}
      {showDemoPrompt && <DemoSignupPrompt onClose={() => setShowDemoPrompt(false)} />}
      {showWeeklyRecap && <WeeklyRecapModal onClose={() => setShowWeeklyRecap(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

      {warnFocusHide && (
        <ConfirmModal
          title="Focus timer is running"
          message="Hiding the widget will stop your active timer session. Are you sure?"
          confirmLabel="Hide anyway"
          onConfirm={() => { toggleWidget('focus-1'); setWarnFocusHide(false); }}
          onCancel={() => setWarnFocusHide(false)}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete saved layout"
          message={`"${savedLayouts.find((s) => s.id === confirmDeleteId)?.name}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => { deleteSavedLayout(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* ── Delete account modal ── */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { if (!deletingAccount) { setDeleteConfirm(false); setDeleteTyped(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dark red header */}
            <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-8 pb-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Delete Account</h2>
                <p className="text-sm text-red-200 mt-1.5 leading-relaxed">
                  This is permanent. Every task, note, milestone, and setting tied to your account will be gone forever.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-gray-900 px-6 -mt-4 rounded-t-3xl pt-5 pb-6 space-y-4">
              {/* Account being deleted */}
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Type to confirm */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Type <span className="font-bold font-mono text-red-500 tracking-widest select-none">DELETE</span> to confirm
                </p>
                <input
                  value={deleteTyped}
                  onChange={(e) => setDeleteTyped(e.target.value)}
                  placeholder="DELETE"
                  disabled={deletingAccount}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteTyped !== 'DELETE'}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                >
                  {deletingAccount ? 'Deleting your account…' : 'Permanently delete my account'}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteTyped(''); }}
                  disabled={deletingAccount}
                  className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Cancel, keep my account
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Sign out confirmation modal ── */}
      {signOutConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setSignOutConfirm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Amber top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />

            <div className="p-6">
              {/* Icon + heading */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Sign out of FlowDesk?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  You'll need to sign back in to access your dashboard, tasks, and progress.
                </p>
              </div>

              {/* Account card */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setSignOutConfirm(false); signOut(); navigate('/'); }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                >
                  Yes, sign me out
                </button>
                <button
                  onClick={() => setSignOutConfirm(false)}
                  className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}
