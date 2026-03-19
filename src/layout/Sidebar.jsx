import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useWidgetStore } from '../store/widgetStore';
import { useEventsStore } from '../store/eventsStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import ConfirmModal from '../components/ConfirmModal';

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
    <svg className={`w-${size} h-${size} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, layoutLocked, toggleLayoutLocked, setShowUsernameModal, focusRunning } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { allWidgets, visibleWidgetIds, toggleWidget, resetLayout, savedLayouts, activeSavedLayoutId, saveCurrentLayout, applySavedLayout, renameSavedLayout, deleteSavedLayout } = useWidgetStore();
  const { canInstall, install } = usePWAInstall();

  const events = useEventsStore((s) => s.events);
  const addEvent = useEventsStore((s) => s.addEvent);

  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [layoutsOpen, setLayoutsOpen] = useState(true);
  const [userDropOpen, setUserDropOpen] = useState(false);
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
  const [quickLoading, setQuickLoading] = useState(false);
  const saveInputRef = useRef(null);
  const addTaskBtnRef = useRef(null);

  const today = toDateStr(new Date());
  const todayEvents = events.filter((e) => {
    const end = e.end_date || e.start_date;
    return e.start_date <= today && end >= today;
  });
  const todayDone = todayEvents.filter((e) => e.completed).length;
  const todayTotal = todayEvents.length;
  const streak = computeStreak(events);

  const closeQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickTitle('');
    setQuickDesc('');
    setQuickEndDate('');
    setQuickColor(EVENT_COLORS[0]);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || !user?.id) return;
    setQuickLoading(true);
    try {
      await addEvent(user.id, title, today, quickEndDate || today, quickColor, quickDesc.trim());
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

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r transition-all duration-300 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Logo + Collapse toggle */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-gray-200 dark:border-gray-800">
        {sidebarOpen && (
          <button
            onClick={() => navigate('/')}
            className="text-base font-bold text-accent-500 tracking-tight hover:text-accent-400 transition-colors"
          >
            FlowDesk
          </button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {sidebarOpen && (
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

      {/* User section */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button
          onClick={() => sidebarOpen && setUserDropOpen(!userDropOpen)}
          title={!sidebarOpen ? displayName : undefined}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${userDropOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {/* User dropdown */}
        {sidebarOpen && userDropOpen && (
          <div className="mt-1 mx-1 space-y-1 overflow-hidden">
            {memberSince && (
              <div className="px-3 py-1">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Member since <span className="text-gray-600 dark:text-gray-400 font-medium">{memberSince}</span></p>
              </div>
            )}
            <button
              onClick={() => { setShowUsernameModal(true); setUserDropOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
            >
              Change username
            </button>
          </div>
        )}
      </div>

      {/* Scrollable middle */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 min-h-0">
        {/* Widgets section */}
        <div>

          <button
            onClick={() => setWidgetsOpen(!widgetsOpen)}
            title={!sidebarOpen ? 'Widgets' : undefined}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${widgetsOpen ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            )}
            {sidebarOpen && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Widgets
              </span>
            )}
          </button>

          {/* Animate open/close */}
          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: sidebarOpen && widgetsOpen ? '400px' : '0px' }}
          >
            <div className="pt-0.5 space-y-0.5">
              {allWidgets.map((widget) => {
                const visible = visibleWidgetIds.includes(widget.id);
                return (
                  <button
                    key={widget.id}
                    onClick={() => {
                      if (widget.id === 'focus-1' && visible && focusRunning) {
                        setWarnFocusHide(true);
                        return;
                      }
                      toggleWidget(widget.id);
                    }}
                    title={!sidebarOpen ? `${widget.label} (${visible ? 'visible' : 'hidden'})` : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      visible
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon d={WIDGET_ICONS[widget.type] || ''} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{widget.label}</span>
                        <svg
                          className="w-4 h-4 shrink-0 opacity-70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          {visible ? (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          )}
                        </svg>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saved Layouts section */}
        <div className="mt-1">
          <button
            onClick={() => setLayoutsOpen(!layoutsOpen)}
            title={!sidebarOpen ? 'Saved Layouts' : undefined}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${layoutsOpen ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
            {sidebarOpen && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-1 text-left">
                Saved Layouts
              </span>
            )}
          </button>

          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: sidebarOpen && layoutsOpen ? '600px' : '0px' }}
          >
            <div className="pt-0.5 space-y-0.5">
              {savedLayouts.map((sl) => (
                <div key={sl.id} className="group flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  {editingId === sl.id ? (
                    <form
                      className="flex-1 flex items-center gap-1"
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
                        onBlur={() => {
                          if (editingName.trim()) renameSavedLayout(sl.id, editingName.trim());
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                        className="flex-1 text-xs px-1.5 py-0.5 rounded border border-accent-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none min-w-0"
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => applySavedLayout(sl.id)}
                        title={sl.name}
                        className="flex-1 flex items-center gap-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 truncate min-w-0"
                      >
                        {activeSavedLayoutId === sl.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />
                        )}
                        <span className="truncate">{sidebarOpen ? sl.name : <Icon d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 13a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />}</span>
                      </button>
                      {sidebarOpen && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => { setEditingId(sl.id); setEditingName(sl.name); }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(sl.id)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Save current layout */}
              {sidebarOpen && (
                showSaveInput ? (
                  <form
                    className="flex items-center gap-1 px-2 py-1"
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
                      ref={saveInputRef}
                      autoFocus
                      value={savingName}
                      onChange={(e) => setSavingName(e.target.value)}
                      onBlur={() => { if (!savingName.trim()) setShowSaveInput(false); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { setShowSaveInput(false); setSavingName(''); } }}
                      placeholder="Layout name…"
                      className="flex-1 text-xs px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-accent-400 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!savingName.trim()}
                      className="px-1.5 py-0.5 text-xs rounded bg-accent-500 text-white disabled:opacity-40 hover:bg-accent-600 transition-colors shrink-0"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-500 hover:bg-accent-500/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Save current layout
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {sidebarOpen && (streak > 0 || todayTotal > 0) && (
          <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-3 pb-2 px-2 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">Today</p>
            <div className="flex flex-col gap-1">
              {streak > 0 && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs">Streak</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{streak} day{streak !== 1 ? 's' : ''}</span>
                </div>
              )}
              {todayTotal > 0 && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs">Tasks done</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{todayDone}/{todayTotal}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick-Add Task */}
        <div className={`${sidebarOpen && (streak > 0 || todayTotal > 0) ? 'mt-2' : 'mt-1'} border-t border-gray-100 dark:border-gray-800 pt-2`}>
          <button
            ref={addTaskBtnRef}
            onClick={() => setShowQuickAdd(true)}
            title={!sidebarOpen ? 'Add task' : undefined}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {sidebarOpen && <span>Add task</span>}
          </button>
        </div>

        {/* Quick-Add Popover */}
        {showQuickAdd && createPortal(
          <div className="fixed inset-0 z-[9990]" onClick={closeQuickAdd}>
            <div
              className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
              style={{
                left: (sidebarOpen ? 244 : 68),
                top: Math.min(
                  addTaskBtnRef.current ? addTaskBtnRef.current.getBoundingClientRect().top : 300,
                  window.innerHeight - 380
                ),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Task</h4>
                  <button
                    onClick={closeQuickAdd}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleQuickAdd} className="space-y-2.5">
                  <input
                    autoFocus
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && closeQuickAdd()}
                    placeholder="Task title…"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  <textarea
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    placeholder="Description (optional)…"
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                  />
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">End date (optional)</label>
                    <input
                      type="date"
                      value={quickEndDate}
                      min={today}
                      onChange={(e) => setQuickEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {EVENT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setQuickColor(c)}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                          style={{ backgroundColor: c, outline: quickColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={quickLoading || !quickTitle.trim()}
                      className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {quickLoading ? '…' : '+ Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 shrink-0 space-y-0.5">
        <SidebarBtn
          icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          label="Install App"
          collapsed={!sidebarOpen}
          onClick={() => {
            if (canInstall) install();
            else alert('Open browser menu → "Install FlowDesk" to install as an app.');
          }}
        />
        <SidebarBtn
          icon={darkMode
            ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
            : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'}
          label={darkMode ? 'Light Mode' : 'Dark Mode'}
          collapsed={!sidebarOpen}
          onClick={toggleDarkMode}
        />
        <SidebarBtn
          icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          label="Reset Layout"
          collapsed={!sidebarOpen}
          onClick={resetLayout}
        />
        <SidebarBtn
          icon="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          label="Sign Out"
          collapsed={!sidebarOpen}
          onClick={signOut}
          danger
        />
      </div>

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
    </aside>
  );
}
