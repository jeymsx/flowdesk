import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';
import { useEventsStore } from '../../store/eventsStore';
import { useWidgetStore } from '../../store/widgetStore';
import { useTagsStore } from '../../store/tagsStore';
import ConfirmModal from '../../components/ConfirmModal';
import TagSelector from '../../components/TagSelector';
import ColorPickerButton from '../../components/ColorPickerButton';
import HexPickerBtn from '../../components/HexPickerBtn';

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

const EVENT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateRange(evt) {
  const opts = { month: 'short', day: 'numeric' };
  const start = new Date(evt.start_date + 'T00:00:00');
  const label = start.toLocaleDateString('en-US', opts);
  if (evt.end_date && evt.end_date !== evt.start_date) {
    const end = new Date(evt.end_date + 'T00:00:00');
    return `${label} – ${end.toLocaleDateString('en-US', opts)}`;
  }
  return label;
}

function isOverdue(evt) {
  const today = toDateStr(new Date());
  return !evt.completed && (evt.end_date || evt.start_date) < today;
}

function applyFilter(events, filter, dateOverride) {
  if (dateOverride) {
    return events.filter((e) => {
      const end = e.end_date || e.start_date;
      return e.start_date <= dateOverride && end >= dateOverride;
    });
  }
  const today = toDateStr(new Date());
  switch (filter) {
    case 'today':
      return events.filter((e) => {
        const end = e.end_date || e.start_date;
        return e.start_date <= today && end >= today;
      });
    case 'upcoming':
      return events.filter((e) => e.start_date > today);
    case 'past':
      return events.filter((e) => (e.end_date || e.start_date) < today);
    default:
      return events;
  }
}

export default function TasksWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const { events, loading, load, addEvent, toggleComplete, updateEvent, deleteEvent } = useEventsStore();
  const { tags, addTag, updateTagColor, renameTag, removeTag, load: loadTags } = useTagsStore();
  const tagsMap = useMemo(() => new Map(tags.map((t) => [t.name, t])), [tags]);
  const taskOrder = useWidgetStore((s) => s.taskOrder);
  const setTaskOrder = useWidgetStore((s) => s.setTaskOrder);

  const [filter, setFilter] = useState('today');
  const [dateOverride, setDateOverride] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editBtnEl, setEditBtnEl] = useState(null);
  const [editPopPos, setEditPopPos] = useState({ left: 100, top: 100 });
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editColor, setEditColor] = useState(EVENT_COLORS[0]);
  const [editTags, setEditTags] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Add task popover state
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addStartDate, setAddStartDate] = useState('');
  const [addEndDate, setAddEndDate] = useState('');
  const [addColor, setAddColor] = useState(EVENT_COLORS[0]);
  const [addTags, setAddTags] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const addBtnRef = useRef(null);

  // Tag panel state
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState(null); // { id, name } | null

  const closeAdd = () => {
    setShowAdd(false);
    setAddTitle('');
    setAddDesc('');
    setAddStartDate('');
    setAddEndDate('');
    setAddColor(EVENT_COLORS[0]);
    setAddTags([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addTitle.trim() || !userId) return;
    const today = toDateStr(new Date());
    const start = addStartDate || today;
    setAddLoading(true);
    try {
      await addEvent(userId, addTitle.trim(), start, addEndDate || start, addColor, addDesc.trim(), addTags);
      closeAdd();
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  // Drag state
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragCounter = useRef(0);

  // Merge new event IDs into taskOrder
  useEffect(() => {
    if (!events.length) return;
    const ids = events.map((e) => e.id);
    const existing = taskOrder.filter((id) => ids.includes(id));
    const newIds = ids.filter((id) => !taskOrder.includes(id));
    if (newIds.length > 0) {
      setTaskOrder([...existing, ...newIds]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  useEffect(() => { load(userId); }, [userId, load]);
  useEffect(() => { if (userId) loadTags(userId); }, [userId, loadTags]);

  // Track anchor positions on scroll/resize
  const [addPopPos, setAddPopPos] = useState({ left: 100, top: 100 });
  const calcAddPos = useCallback(() => {
    const r = addBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    setAddPopPos({ left: Math.min(r.right - 288, window.innerWidth - 296), top: Math.min(r.bottom + 8, window.innerHeight - 420) });
  }, []);
  useEffect(() => {
    if (!showAdd) return;
    calcAddPos();
    window.addEventListener('scroll', calcAddPos, true);
    window.addEventListener('resize', calcAddPos);
    return () => { window.removeEventListener('scroll', calcAddPos, true); window.removeEventListener('resize', calcAddPos); };
  }, [showAdd, calcAddPos]);

  const calcEditPos = useCallback(() => {
    if (!editBtnEl) return;
    const r = editBtnEl.getBoundingClientRect();
    setEditPopPos({ left: Math.min(r.right - 320, window.innerWidth - 332), top: Math.min(r.bottom + 8, window.innerHeight - 500) });
  }, [editBtnEl]);
  useEffect(() => {
    if (!editingId || !editBtnEl) return;
    calcEditPos();
    window.addEventListener('scroll', calcEditPos, true);
    window.addEventListener('resize', calcEditPos);
    return () => { window.removeEventListener('scroll', calcEditPos, true); window.removeEventListener('resize', calcEditPos); };
  }, [editingId, editBtnEl, calcEditPos]);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (evt, btnEl) => {
    setEditingId(evt.id);
    setEditBtnEl(btnEl || null);
    setEditTitle(evt.title);
    setEditDesc(evt.description || '');
    setEditStartDate(evt.start_date || '');
    setEditEndDate(evt.end_date || '');
    setEditColor(evt.color || EVENT_COLORS[0]);
    setEditTags(evt.tags || []);
  };

  const saveEdit = async (evt) => {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    try {
      await updateEvent(evt.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        start_date: editStartDate || evt.start_date,
        end_date: editEndDate && editEndDate >= (editStartDate || evt.start_date) ? editEndDate : null,
        color: editColor,
        tags: editTags,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    setDeletingId(id);
    try {
      await deleteEvent(id);
      if (editingId === id) setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragEnter = (e, id) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (id !== dragId) setDragOverId(id);
  };

  const handleDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragOverId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, overId) => {
    e.preventDefault();
    dragCounter.current = 0;
    if (!dragId || dragId === overId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const next = [...taskOrder];
    const fromIdx = next.indexOf(dragId);
    const toIdx = next.indexOf(overId);
    if (fromIdx !== -1 && toIdx !== -1) {
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragId);
      setTaskOrder(next);
    }
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragCounter.current = 0;
    setDragId(null);
    setDragOverId(null);
  };

  // ── Filter / sort ─────────────────────────────────────────────────────────
  const filtered = applyFilter(events, filter, dateOverride);

  const incompleteFiltered = filtered.filter((e) => !e.completed);
  const completedFiltered = filtered.filter((e) => e.completed);

  const incompleteOrdered = [...incompleteFiltered].sort((a, b) => {
    const ai = taskOrder.indexOf(a.id);
    const bi = taskOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const sorted = [...incompleteOrdered, ...completedFiltered];
  const doneCount = completedFiltered.length;

  const activeLabel = dateOverride
    ? new Date(dateOverride + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const confirmEvt = events.find((e) => e.id === confirmId);
  const editEvt = events.find((e) => e.id === editingId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {confirmId && (
        <ConfirmModal
          title="Delete task?"
          message={`"${confirmEvt?.title || 'This task'}" will be permanently deleted from your calendar.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Edit task popover (portal, anchored to edit button) */}
      {editingId && editEvt && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={() => setEditingId(null)}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-80 overflow-hidden"
            style={{
              left: editPopPos.left,
              top: editPopPos.top,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Edit Task</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(null); setConfirmId(editingId); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete task"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Title */}
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                  placeholder="Task title"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-shadow"
                />

                {/* Description */}
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Add a description…"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none transition-shadow"
                />

                {/* Tags */}
                <TagSelector
                  selected={editTags}
                  onChange={setEditTags}
                  tags={tags}
                  onCreateTag={(name) => addTag(userId, name)}
                />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Start date</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => {
                        setEditStartDate(e.target.value);
                        if (editEndDate && editEndDate < e.target.value) setEditEndDate('');
                      }}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent dark:[color-scheme:dark] transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">End date</label>
                    <input
                      type="date"
                      value={editEndDate}
                      min={editStartDate || editEvt.start_date}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent dark:[color-scheme:dark] transition-shadow"
                    />
                  </div>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-2 flex-wrap">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{ backgroundColor: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                    />
                  ))}
                  <HexPickerBtn color={editColor} onChange={setEditColor} presets={EVENT_COLORS} />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => saveEdit(editEvt)}
                    disabled={editSaving || !editTitle.trim()}
                    className="flex-1 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Tasks
        </h3>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
              {doneCount}/{filtered.length} done
            </span>
          )}
          <button
            ref={addBtnRef}
            onClick={() => setShowAdd(true)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            title="Add task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add task popover */}
      {showAdd && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={closeAdd}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
            style={{ left: addPopPos.left, top: addPopPos.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Task</h4>
                <button onClick={closeAdd} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <input
                  autoFocus
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeAdd()}
                  placeholder="Task title…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <textarea
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Description (optional)…"
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
                <TagSelector
                  selected={addTags}
                  onChange={setAddTags}
                  tags={tags}
                  onCreateTag={(name) => addTag(userId, name)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">Start date (optional)</label>
                    <input
                      type="date"
                      value={addStartDate}
                      onChange={(e) => {
                        setAddStartDate(e.target.value);
                        if (addEndDate && e.target.value > addEndDate) setAddEndDate(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">End date (optional)</label>
                    <input
                      type="date"
                      value={addEndDate}
                      min={addStartDate || toDateStr(new Date())}
                      onChange={(e) => setAddEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAddColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{ backgroundColor: c, outline: addColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                    />
                  ))}
                  <HexPickerBtn color={addColor} onChange={setAddColor} size="sm" presets={EVENT_COLORS} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={addLoading || !addTitle.trim()}
                    className="flex-1 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {addLoading ? '…' : '+ Add'}
                  </button>
                  <button
                    type="button"
                    onClick={closeAdd}
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

      {/* Filter row */}
      <div className="flex items-center gap-1.5 px-3 pb-2 shrink-0">
        {!dateOverride && FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
              filter === key
                ? 'bg-accent-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
        {dateOverride && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-500 text-white">
            {activeLabel}
          </span>
        )}

        <div className="flex-1" />

        {/* Date picker */}
        <div className="relative">
          <label
            className={`flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors ${
              dateOverride
                ? 'bg-accent-500/15 text-accent-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white'
            }`}
            title="Filter by specific date"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={dateOverride}
              onChange={(e) => setDateOverride(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </label>
        </div>
        {dateOverride && (
          <button
            onClick={() => setDateOverride('')}
            className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            title="Clear date filter"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {filtered.length > 0 && (
        <div className="px-3 pb-2 shrink-0">
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / filtered.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {dateOverride
                ? `No tasks on ${activeLabel}`
                : filter === 'all'
                  ? 'No tasks yet — add events in the calendar'
                  : `No ${filter} tasks`}
            </p>
          </div>
        ) : (
          sorted.map((evt) => {
            const isDraggable = !evt.completed;
            const isBeingDragged = dragId === evt.id;
            const isDropTarget = dragOverId === evt.id && dragId !== evt.id;

            return (
              <div
                key={evt.id}
                draggable={isDraggable}
                onDragStart={isDraggable ? (e) => handleDragStart(e, evt.id) : undefined}
                onDragEnter={isDraggable ? (e) => handleDragEnter(e, evt.id) : undefined}
                onDragLeave={isDraggable ? handleDragLeave : undefined}
                onDragOver={isDraggable ? handleDragOver : undefined}
                onDrop={isDraggable ? (e) => handleDrop(e, evt.id) : undefined}
                onDragEnd={isDraggable ? handleDragEnd : undefined}
                className={`px-2.5 py-2 rounded-xl border transition-all ${
                  isBeingDragged
                    ? 'opacity-40 scale-[0.98]'
                    : isDropTarget
                      ? 'border-accent-400 bg-accent-500/5 dark:bg-accent-500/10 shadow-sm'
                      : evt.completed
                        ? 'border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20'
                        : isOverdue(evt)
                          ? 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Drag handle — only for incomplete tasks */}
                  {!evt.completed ? (
                    <div className="mt-1 shrink-0 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                        <circle cx="4" cy="2.5" r="1" />
                        <circle cx="8" cy="2.5" r="1" />
                        <circle cx="4" cy="6" r="1" />
                        <circle cx="8" cy="6" r="1" />
                        <circle cx="4" cy="9.5" r="1" />
                        <circle cx="8" cy="9.5" r="1" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-3 shrink-0" />
                  )}

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(evt.id, evt.completed)}
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      evt.completed
                        ? 'border-accent-500 bg-accent-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-accent-400'
                    }`}
                  >
                    {evt.completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: evt.color || '#22c55e', opacity: evt.completed ? 0.4 : 1 }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${
                      evt.completed
                        ? 'line-through text-gray-400 dark:text-gray-600'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {evt.title}
                    </p>
                    {evt.description && !evt.completed && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{evt.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className={`text-[10px] ${evt.completed ? 'text-gray-400 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatDateRange(evt)}
                      </p>
                      {isOverdue(evt) && (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/15 px-1.5 py-0.5 rounded-full leading-none">
                          Overdue
                        </span>
                      )}
                    </div>
                    {evt.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {evt.tags.map((tagName) => {
                          const c = tagsMap.get(tagName)?.color || '#22c55e';
                          return (
                            <span
                              key={tagName}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                              style={
                                evt.completed
                                  ? { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                                  : { backgroundColor: c + '22', color: c }
                              }
                            >
                              {tagName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      onClick={(e) => startEdit(evt, e.currentTarget)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmId(evt.id)}
                      disabled={deletingId === evt.id}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tag Management Panel */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setShowTagPanel(!showTagPanel)}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">Tags</span>
            {tags.length > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-600">({tags.length})</span>
            )}
          </div>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showTagPanel ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showTagPanel && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const c = tag.color || '#22c55e';
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 group"
                >
                  <ColorPickerButton
                    color={c}
                    onChange={(newColor) => updateTagColor(tag.id, newColor)}
                    size="tiny"
                  />
                  {editingTag?.id === tag.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingTag.name}
                      onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameTag(tag.id, tag.name, editingTag.name);
                          setEditingTag(null);
                        } else if (e.key === 'Escape') {
                          setEditingTag(null);
                        }
                      }}
                      onBlur={() => {
                        renameTag(tag.id, tag.name, editingTag.name);
                        setEditingTag(null);
                      }}
                      className="text-[11px] font-medium bg-transparent border-b border-accent-400 text-gray-700 dark:text-gray-200 focus:outline-none w-16 leading-none"
                    />
                  ) : (
                    <span
                      className="text-[11px] font-medium text-gray-700 dark:text-gray-200 max-w-[80px] truncate leading-none cursor-text hover:text-accent-500 transition-colors"
                      onClick={() => setEditingTag({ id: tag.id, name: tag.name })}
                      title="Click to rename"
                    >
                      {tag.name}
                    </span>
                  )}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="opacity-0 group-hover:opacity-100 ml-0.5 text-gray-400 hover:text-red-500 transition-all shrink-0"
                    title="Remove tag"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* New tag */}
            {showNewTag ? (
              <input
                autoFocus
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const name = newTagInput.trim().replace(/,$/, '');
                    if (name) { addTag(userId, name); setNewTagInput(''); setShowNewTag(false); }
                  } else if (e.key === 'Escape') {
                    setNewTagInput(''); setShowNewTag(false);
                  }
                }}
                onBlur={() => { setNewTagInput(''); setShowNewTag(false); }}
                placeholder="Tag name…"
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500 w-28"
              />
            ) : (
              <button
                onClick={() => setShowNewTag(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-400 hover:text-accent-500 border border-dashed border-gray-300 dark:border-gray-600 hover:border-accent-400 transition-colors"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
