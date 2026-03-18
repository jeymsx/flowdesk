import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';
import { useEventsStore } from '../../store/eventsStore';
import ConfirmModal from '../../components/ConfirmModal';

// Sunday first
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocal(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

// Sunday-first month grid
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, nextDay++), current: false });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ── Day popover (anchored below the clicked cell, no overlay) ─────────────────

const POPOVER_W = 292;

function DayPopover({ date, rect, dayEvents, onClose, onAdd, onDelete }) {
  const popoverRef = useRef(null);
  const inputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [confirmEvt, setConfirmEvt] = useState(null);

  // Position: prefer below the cell, flip above if too close to bottom
  const estimatedH = 320 + dayEvents.length * 28;
  const showAbove = rect.bottom + estimatedH + 8 > window.innerHeight;
  const top = showAbove ? Math.max(8, rect.top - estimatedH - 4) : rect.bottom + 4;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_W - 8));

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Dismiss on outside click (deferred so the opening click doesn't immediately close)
    const onOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', onOutside), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd(title.trim(), toDateStr(date), endDate || null, color, description.trim());
      setTitle('');
      setDescription('');
      setEndDate('');
      setColor(EVENT_COLORS[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      {confirmEvt && (
        <ConfirmModal
          title="Delete event?"
          message={`"${confirmEvt.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => { onDelete(confirmEvt.id); setConfirmEvt(null); }}
          onCancel={() => setConfirmEvt(null)}
        />
      )}
      <div
        ref={popoverRef}
        style={{ position: 'fixed', top, left, width: POPOVER_W, zIndex: 9990 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {dayEvents.length > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {dayEvents.length} task{dayEvents.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing events for this day */}
          {dayEvents.length > 0 && (
            <div className="mb-3 space-y-1 max-h-28 overflow-y-auto">
              {dayEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-2 group">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: evt.color || '#22c55e' }} />
                  <p className={`flex-1 text-xs truncate ${evt.completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {evt.title}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmEvt(evt); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {dayEvents.length > 0 && <div className="border-t border-gray-100 dark:border-gray-800 mb-3" />}

          {/* Add form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a new event…"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)…"
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            />
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">End date (optional)</label>
              <input
                type="date"
                value={endDate}
                min={toDateStr(date)}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {saving ? '…' : '+ Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}


// ── Compact widget grid (dots per cell) ───────────────────────────────────────

function getEventsForDay(date, events) {
  const d = toDateStr(date);
  return events.filter((evt) => {
    const s = evt.start_date;
    const e = evt.end_date || evt.start_date;
    return d >= s && d <= e;
  });
}

function CalendarGrid({ weeks, events, onDayClick }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 px-2 pb-2 gap-px">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex-1 grid grid-cols-7 min-h-0">
          {week.map(({ date, current }, i) => {
            const tod = isToday(date);
            const dayEvts = current ? getEventsForDay(date, events) : [];

            return (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); if (current) onDayClick(date, e.currentTarget.getBoundingClientRect()); }}
                className={`flex flex-col items-center justify-center cursor-pointer rounded-lg transition-colors gap-0.5 ${
                  current ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60' : 'opacity-20 pointer-events-none'
                }`}
              >
                <span className={`text-sm font-medium flex items-center justify-center rounded-full w-8 h-8 ${
                  tod
                    ? 'bg-accent-500 text-white font-bold'
                    : current
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {date.getDate()}
                </span>

                {/* Colored dots for events */}
                {dayEvts.length > 0 && (
                  <div className="flex gap-[3px] justify-center">
                    {dayEvts.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: evt.color || '#22c55e' }}
                      />
                    ))}
                    {dayEvts.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Fullscreen overlay (portal) ───────────────────────────────────────────────

function FullscreenCalendar({ year, month, weeks, events, loading, monthLabel, onPrev, onNext, onClose, onAddEvent, onDeleteEvent, onUpdateEvent }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addEndDate, setAddEndDate] = useState('');
  const [addColor, setAddColor] = useState(EVENT_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const titleInputRef = useRef(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editColor, setEditColor] = useState(EVENT_COLORS[0]);
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm state
  const [confirmEvt, setConfirmEvt] = useState(null);

  const startEdit = (evt) => {
    setEditingId(evt.id);
    setEditTitle(evt.title);
    setEditDesc(evt.description || '');
    setEditEndDate(evt.end_date || '');
    setEditColor(evt.color || EVENT_COLORS[0]);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (evt) => {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    try {
      await onUpdateEvent(evt.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        end_date: editEndDate || null,
        color: editColor,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedDateStr = toDateStr(selectedDate);

  const getEventsForDay = (date) => {
    const d = toDateStr(date);
    return events.filter((evt) => {
      const s = evt.start_date;
      const e = evt.end_date || evt.start_date;
      return d >= s && d <= e;
    });
  };

  const dateEvents = getEventsForDay(selectedDate);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addTitle.trim()) return;
    setAdding(true);
    try {
      await onAddEvent(addTitle.trim(), selectedDateStr, addEndDate || null, addColor, addDesc.trim());
      setAddTitle('');
      setAddDesc('');
      setAddEndDate('');
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return createPortal(
    <>
      {confirmEvt && (
        <ConfirmModal
          title="Delete event?"
          message={`"${confirmEvt.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => { onDeleteEvent(confirmEvt.id); setConfirmEvt(null); }}
          onCancel={() => setConfirmEvt(null)}
        />
      )}
    <div className="fixed inset-0 z-[9980] bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-full max-h-[92vh] flex bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">

        {/* ── Left: Calendar grid ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{monthLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={onClose} className="ml-1 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" title="Close (Esc)">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 px-4 pb-2 shrink-0">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 px-4 pb-4"
              style={{ display: 'grid', gridTemplateRows: `repeat(${weeks.length}, 1fr)`, gap: 8 }}
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-2 min-h-0">
                  {week.map(({ date, current }, i) => {
                    const tod = isToday(date);
                    const sel = toDateStr(date) === selectedDateStr;
                    const dayEvts = getEventsForDay(date);

                    return (
                      <div
                        key={i}
                        onClick={() => { if (current) { setSelectedDate(date); titleInputRef.current?.focus(); } }}
                        className={`rounded-xl border p-2 flex flex-col cursor-pointer transition-all overflow-hidden ${
                          !current
                            ? 'opacity-20 pointer-events-none border-gray-100 dark:border-gray-800'
                            : sel
                              ? 'border-accent-500/40 bg-accent-500/5 dark:bg-accent-500/10'
                              : tod
                                ? 'border-accent-500/20 bg-accent-500/[0.03]'
                                : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        {/* Day number */}
                        <div className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
                          tod ? 'bg-accent-500 text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {date.getDate()}
                        </div>

                        {/* Event chips */}
                        <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                          {dayEvts.slice(0, 3).map((evt) => (
                            <button
                              key={evt.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedDate(date); }}
                              className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white truncate leading-tight"
                              style={{ backgroundColor: evt.color || '#22c55e' }}
                              title={evt.title}
                            >
                              {evt.title}
                            </button>
                          ))}
                          {dayEvts.length > 3 && (
                            <span className="text-[10px] text-gray-400 pl-1">+{dayEvts.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Events panel ── */}
        <div className="w-72 shrink-0 border-l border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-5 py-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Adding events for</p>
            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Click a date to change</p>
          </div>

          {/* Add form */}
          <form onSubmit={handleAdd} className="px-5 py-4 shrink-0 border-b border-gray-100 dark:border-gray-800 space-y-2.5">
            <input
              ref={titleInputRef}
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="Add a new event…"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <textarea
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              placeholder="Description (optional)…"
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            />
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">End date (optional)</label>
              <input
                type="date"
                value={addEndDate}
                min={selectedDateStr}
                onChange={(e) => setAddEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAddColor(c)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                    style={{ backgroundColor: c, outline: addColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={adding || !addTitle.trim()}
                className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {adding ? '…' : '+ Add'}
              </button>
            </div>
          </form>

          {/* Events for selected date */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {dateEvents.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-6">No events on this day</p>
            ) : (
              dateEvents.map((evt) => (
                <div key={evt.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  {editingId === evt.id ? (
                    /* ── Inline edit form ── */
                    <div className="space-y-2">
                      <input
                        autoFocus
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description…"
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                      />
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">End date</label>
                        <input
                          type="date"
                          value={editEndDate}
                          min={evt.start_date}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        {EVENT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                            style={{ backgroundColor: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(evt)}
                          disabled={editSaving || !editTitle.trim()}
                          className="flex-1 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Event display ── */
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: evt.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{evt.title}</p>
                        {evt.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{evt.description}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {parseLocal(evt.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {evt.end_date && evt.end_date !== evt.start_date && (
                            <> – {parseLocal(evt.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={() => startEdit(evt)}
                          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmEvt(evt)}
                          className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </>,
    document.body
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CalendarWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const { events: allEvents, loading, load, addEvent, updateEvent: storeUpdate, deleteEvent: storeDelete } = useEventsStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  // addingTo: { date, rect } | null
  const [addingTo, setAddingTo] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { load(userId); }, [userId, load]);

  // Filter store events to the current month view
  const monthStart = toDateStr(new Date(year, month, 1));
  const monthEnd = toDateStr(new Date(year, month + 1, 0));
  const events = allEvents.filter((e) => {
    const end = e.end_date || e.start_date;
    return e.start_date <= monthEnd && end >= monthStart;
  });

  const weeks = getMonthGrid(year, month);
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleAddEvent = (title, startDate, endDate, color, description) =>
    addEvent(userId, title, startDate, endDate, color, description);

  const handleUpdateEvent = (id, updates) => storeUpdate(id, updates);

  const handleDelete = async (id) => {
    try { await storeDelete(id); } catch {}
  };

  const handleDayClick = (date, rect) => setAddingTo({ date, rect });

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const goToToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  return (
    <>
      {addingTo && (
        <DayPopover
          date={addingTo.date}
          rect={addingTo.rect}
          dayEvents={getEventsForDay(addingTo.date, allEvents)}
          onClose={() => setAddingTo(null)}
          onAdd={handleAddEvent}
          onDelete={handleDelete}
        />
      )}

      {isFullscreen && (
        <FullscreenCalendar
          year={year}
          month={month}
          weeks={weeks}
          events={events}
          loading={loading}
          monthLabel={monthLabel}
          onPrev={prevMonth}
          onNext={nextMonth}
          onClose={() => setIsFullscreen(false)}
          onAddEvent={handleAddEvent}
          onDeleteEvent={handleDelete}
          onUpdateEvent={handleUpdateEvent}
        />
      )}

      <div className="h-full flex flex-col overflow-hidden relative select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar
          </h3>
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-1">{monthLabel}</span>
            {!isCurrentMonth && (
              <button
                onClick={goToToday}
                className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent-500/15 text-accent-600 dark:text-accent-400 hover:bg-accent-500/25 transition-colors mr-0.5"
              >
                Today
              </button>
            )}
            <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
              className="p-1 ml-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              title="Expand calendar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 px-2 shrink-0 border-b border-gray-100 dark:border-gray-800 py-1.5">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grid body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <CalendarGrid
            weeks={weeks}
            events={events}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </>
  );
}
