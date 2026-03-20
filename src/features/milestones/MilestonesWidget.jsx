import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';
import { useMilestonesStore } from '../../store/milestonesStore';
import { useWidgetStore } from '../../store/widgetStore';
import ConfirmModal from '../../components/ConfirmModal';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getProgress(createdAt, dateStr) {
  const now = new Date();
  const created = new Date(createdAt);
  const target = new Date(dateStr + 'T00:00:00');
  const total = target - created;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((now - created) / total) * 100));
}

function formatDate(str) {
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MilestonesSkeleton() {
  return (
    <div className="px-2 pb-2 space-y-2">
      {[0, 1].map((i) => (
        <div key={i} className="px-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-3" />
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function MilestoneCard({ m, isNearest, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const daysLeft = getDaysLeft(m.date);
  const progress = getProgress(m.created_at, m.date);
  const isPast = daysLeft < 0;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const dayDisplay = isPast ? 'Passed' : daysLeft === 0 ? 'Today' : String(daysLeft);
  const dayColor = isPast ? 'text-gray-400 dark:text-gray-500' : daysLeft === 0 ? 'text-accent-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-900 dark:text-white';

  return (
    <div className={`px-4 pt-3 pb-3 rounded-2xl border transition-all ${
      isPast
        ? 'border-gray-100 dark:border-gray-800 opacity-60'
        : isNearest
          ? 'border-accent-400/30 bg-accent-500/[0.03] dark:bg-accent-500/5'
          : 'border-gray-100 dark:border-gray-800'
    }`}>
      {/* Top row: title + menu */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate">
          {m.title}
        </span>
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-20 w-32 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit(m); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(m.id); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Big countdown number */}
      <div className="flex items-end gap-2 mb-1.5">
        <span className={`text-5xl font-black leading-none tabular-nums ${dayColor} ${isPast ? '' : ''}`}>
          {dayDisplay}
        </span>
        {!isPast && daysLeft !== 0 && (
          <span className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            days
          </span>
        )}
      </div>

      {/* Date */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{formatDate(m.date)}</p>

      {/* Description */}
      {m.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-2">{m.description}</p>
      )}

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPast ? 'bg-gray-300 dark:bg-gray-600' : isNearest ? 'bg-accent-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function EditCard({ m, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(m.title);
  const [date, setDate] = useState(m.date);
  const [description, setDescription] = useState(m.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave(m.id, { title: title.trim(), date, description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 rounded-2xl border border-accent-400/40 bg-accent-500/5 dark:bg-accent-500/5 space-y-2">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Milestone title…"
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !date}
          className="px-3 py-1.5 text-xs font-bold bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function MilestonesWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const { milestones, loading, load, addMilestone, editMilestone, removeMilestone } = useMilestonesStore();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const addBtnRef = useRef(null);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const setWidgetHeight = useWidgetStore((s) => s.setWidgetHeight);
  const widgetInitialized = useWidgetStore((s) => s.initialized);
  const prevLengthRef = useRef(null);

  useEffect(() => { load(userId); }, [userId, load]);

  const [formPos, setFormPos] = useState({ left: 100, top: 100 });
  const calcFormPos = useCallback(() => {
    const r = addBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    setFormPos({ left: Math.max(8, Math.min(r.right - 288, window.innerWidth - 296)), top: Math.max(8, Math.min(r.bottom + 8, window.innerHeight - 320)) });
  }, []);
  useEffect(() => {
    if (!showForm) return;
    calcFormPos();
    window.addEventListener('scroll', calcFormPos, true);
    window.addEventListener('resize', calcFormPos);
    return () => { window.removeEventListener('scroll', calcFormPos, true); window.removeEventListener('resize', calcFormPos); };
  }, [showForm, calcFormPos]);

  useEffect(() => {
    // Only grow when a milestone is actively added during this session,
    // not during the initial data load. Wait for the widget layout to be
    // initialized so we don't override the saved height from Supabase.
    if (!widgetInitialized) {
      prevLengthRef.current = milestones.length;
      return;
    }
    if (prevLengthRef.current === null) {
      prevLengthRef.current = milestones.length;
      return;
    }
    if (milestones.length > prevLengthRef.current) {
      const h = Math.max(4, Math.min(4 + milestones.length * 3, 20));
      setWidgetHeight('milestones-1', h);
    }
    prevLengthRef.current = milestones.length;
  }, [milestones.length, widgetInitialized, setWidgetHeight]);

  const today = toDateStr(new Date());

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !userId) return;
    setSaving(true);
    try {
      await addMilestone(userId, title.trim(), date, description.trim());
      setTitle(''); setDate(''); setDescription('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id, updates) => {
    setEditSaving(true);
    try {
      await editMilestone(id, updates);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try { await removeMilestone(id); } catch (err) { console.error(err); }
  };

  // Sort: upcoming first (asc), then past (desc)
  const upcoming = milestones.filter((m) => m.date >= today);
  const past = milestones.filter((m) => m.date < today).reverse();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {confirmId && (
        <ConfirmModal
          title="Delete milestone?"
          message={`"${milestones.find((m) => m.id === confirmId)?.title || 'This milestone'}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2" />
          </svg>
          Milestones
        </h3>
        <button
          ref={addBtnRef}
          onClick={() => { setShowForm((v) => !v); setEditingId(null); }}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          title="Add milestone"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add popover */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={() => { setShowForm(false); setTitle(''); setDate(''); setDescription(''); }}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
            style={formPos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Milestone</h4>
                <button
                  onClick={() => { setShowForm(false); setTitle(''); setDate(''); setDescription(''); }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-2.5">
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowForm(false)}
                  placeholder="Milestone title…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowForm(false)}
                  placeholder="Description (optional)…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !date}
                  className="w-full py-2 text-sm font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white rounded-xl transition-colors"
                >
                  {saving ? 'Saving…' : 'Add Milestone'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
        {loading ? (
          <MilestonesSkeleton />
        ) : milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2" />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">No milestones yet</p>
            <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">Press + to add one</p>
          </div>
        ) : (
          <div className="space-y-2 pt-0.5">
            {upcoming.map((m, idx) =>
              editingId === m.id ? (
                <EditCard
                  key={m.id}
                  m={m}
                  saving={editSaving}
                  onSave={handleEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <MilestoneCard
                  key={m.id}
                  m={m}
                  isNearest={idx === 0}
                  onEdit={(m) => { setEditingId(m.id); setShowForm(false); }}
                  onDelete={(id) => setConfirmId(id)}
                />
              )
            )}

            {past.length > 0 && (
              <>
                {upcoming.length > 0 && <div className="border-t border-gray-100 dark:border-gray-800 my-1" />}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600 px-1">Passed</p>
                {past.map((m) =>
                  editingId === m.id ? (
                    <EditCard
                      key={m.id}
                      m={m}
                      today={today}
                      saving={editSaving}
                      onSave={handleEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <MilestoneCard
                      key={m.id}
                      m={m}
                      isNearest={false}
                      onEdit={(m) => { setEditingId(m.id); setShowForm(false); }}
                      onDelete={(id) => setConfirmId(id)}
                    />
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
