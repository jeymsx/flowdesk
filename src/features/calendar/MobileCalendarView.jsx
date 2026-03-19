import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEventsStore } from '../../store/eventsStore';
import ConfirmModal from '../../components/ConfirmModal';
import BottomSheet from '../../layout/BottomSheet';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
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

function getEventsForDay(date, events) {
  const d = toDateStr(date);
  return events.filter((evt) => {
    const s = evt.start_date;
    const e = evt.end_date || evt.start_date;
    return d >= s && d <= e;
  });
}

// ── Day Detail Sheet ──────────────────────────────────────────────────────────

function DayDetailSheet({ open, onClose, selectedDate, events, onAdd, onDelete, onUpdate }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editColor, setEditColor] = useState(EVENT_COLORS[0]);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmEvt, setConfirmEvt] = useState(null);

  const dateStr = selectedDate ? toDateStr(selectedDate) : '';
  const dayEvents = selectedDate ? getEventsForDay(selectedDate, events) : [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd(title.trim(), dateStr, endDate || null, color, desc.trim());
      setTitle('');
      setDesc('');
      setEndDate('');
      setColor(EVENT_COLORS[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (evt) => {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    try {
      await onUpdate(evt.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        start_date: editStartDate || evt.start_date,
        end_date: editEndDate && editEndDate >= (editStartDate || evt.start_date) ? editEndDate : null,
        color: editColor,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  const startEdit = (evt) => {
    setEditingId(evt.id);
    setEditTitle(evt.title);
    setEditDesc(evt.description || '');
    setEditStartDate(evt.start_date || '');
    setEditEndDate(evt.end_date || '');
    setEditColor(evt.color || EVENT_COLORS[0]);
  };

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
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
      <BottomSheet open={open} onClose={onClose} maxHeight="80vh">
        <div className="px-5 pt-2 pb-4">
          {/* Date header */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">Selected</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{dateLabel}</p>
          </div>

          {/* Add form */}
          <form onSubmit={handleAdd} className="space-y-3 mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a new event…"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)…"
              rows={2}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            />
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">End date (optional)</label>
              <input
                type="date"
                value={endDate}
                min={dateStr}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-transform active:scale-90"
                    style={{ backgroundColor: c, outline: color === c ? `2.5px solid ${c}` : 'none', outlineOffset: 2 }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-4 py-2 bg-accent-500 hover:bg-accent-600 active:bg-accent-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {saving ? '…' : '+ Add'}
              </button>
            </div>
          </form>

          {/* Events list */}
          {dayEvents.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((evt) => (
                <div key={evt.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  {editingId === evt.id ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description…"
                        rows={2}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Start date</label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => {
                              setEditStartDate(e.target.value);
                              if (editEndDate && editEndDate < e.target.value) setEditEndDate('');
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">End date</label>
                          <input
                            type="date"
                            value={editEndDate}
                            min={editStartDate || evt.start_date}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {EVENT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(evt)}
                          disabled={editSaving || !editTitle.trim()}
                          className="flex-1 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: evt.color || '#22c55e' }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${evt.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {evt.title}
                        </p>
                        {evt.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{evt.description}</p>
                        )}
                        {evt.end_date && evt.end_date !== evt.start_date && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Until {evt.end_date}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(evt)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmEvt(evt)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

// ── Main Mobile Calendar ──────────────────────────────────────────────────────

export default function MobileCalendarView() {
  const userId = useAuthStore((s) => s.user?.id);
  const { events: allEvents, loading, load, addEvent, updateEvent, deleteEvent } = useEventsStore();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => { load(userId); }, [userId, load]);

  const monthStart = toDateStr(new Date(year, month, 1));
  const monthEnd = toDateStr(new Date(year, month + 1, 0));
  const events = allEvents.filter((e) => {
    const end = e.end_date || e.start_date;
    return e.start_date <= monthEnd && end >= monthStart;
  });

  const weeks = getMonthGrid(year, month);
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const handleAdd = (title, startDate, endDate, color, description) =>
    addEvent(userId, title, startDate, endDate, color, description);

  const handleUpdate = (id, updates) => updateEvent(id, updates);

  const handleDelete = async (id) => {
    try { await deleteEvent(id); } catch {}
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-accent-500/15 text-accent-600 dark:text-accent-400 hover:bg-accent-500/25 transition-colors mr-1"
            >
              Today
            </button>
          )}
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-2 py-2 shrink-0 border-b border-gray-100 dark:border-gray-800">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div
          className="flex-1 min-h-0 px-2 py-2"
          style={{ display: 'grid', gridTemplateRows: `repeat(${weeks.length}, 1fr)`, gap: 4 }}
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 min-h-0">
              {week.map(({ date, current }, i) => {
                const tod = isToday(date);
                const sel = selectedDate && toDateStr(date) === toDateStr(selectedDate);
                const dayEvts = current ? getEventsForDay(date, events) : [];

                return (
                  <button
                    key={i}
                    disabled={!current}
                    onClick={() => { if (current) setSelectedDate(date); }}
                    className={`flex flex-col p-0.5 rounded-xl transition-colors overflow-hidden min-h-0 ${
                      !current
                        ? 'opacity-20 pointer-events-none'
                        : sel
                          ? 'bg-accent-500/10'
                          : 'active:bg-gray-100 dark:active:bg-gray-800'
                    }`}
                  >
                    {/* Day number */}
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full shrink-0 mx-auto ${
                      tod
                        ? 'bg-accent-500 text-white font-bold'
                        : sel
                          ? 'text-accent-600 dark:text-accent-400 font-bold'
                          : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {date.getDate()}
                    </span>
                    {/* Event chips */}
                    {dayEvts.length > 0 && (
                      <div className="mt-0.5 flex flex-col gap-px w-full overflow-hidden">
                        {dayEvts.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className="text-[8px] font-bold px-1 py-px rounded-sm text-white truncate leading-tight w-full"
                            style={{ backgroundColor: evt.color || '#22c55e' }}
                          >
                            {evt.title}
                          </div>
                        ))}
                        {dayEvts.length > 2 && (
                          <span className="text-[8px] text-gray-400 dark:text-gray-500 pl-0.5 leading-tight">
                            +{dayEvts.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Day detail bottom sheet */}
      <DayDetailSheet
        key={selectedDate ? toDateStr(selectedDate) : 'none'}
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
        events={allEvents}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
