import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { fetchNotes, createNote, updateNote, deleteNote } from '../../services/notes';
import { NotesSkeleton } from '../../components/Skeleton';
import ConfirmModal from '../../components/ConfirmModal';

function formatRelative(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TAG_COLORS = [
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
];

function getTagColor(tag) {
  let hash = 0;
  for (const c of tag) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function TagChip({ tag, onRemove }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTagColor(tag)}`}>
      #{tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 leading-none">
          ×
        </button>
      )}
    </span>
  );
}

export default function NotesWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const saveTimer = useRef(null);
  const savedTimer = useRef(null);

  // Search + filter
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  // Confirm delete
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchNotes(userId)
      .then((data) => { setNotes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  // Auto-save 1s after any edit
  useEffect(() => {
    if (!activeNote) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      doSave(activeNote, title, content, tags);
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [title, content, tags]); // eslint-disable-line

  const doSave = async (note, t, c, tg) => {
    if (t === note.title && c === note.content && JSON.stringify(tg) === JSON.stringify(note.tags)) return;
    setSaving(true);
    try {
      const updated = await updateNote(note.id, { title: t, content: c, tags: tg });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setActiveNote(updated);
      // Show "Saved" indicator briefly
      clearTimeout(savedTimer.current);
      setSavedRecently(true);
      savedTimer.current = setTimeout(() => setSavedRecently(false), 2000);
    } catch (err) {
      console.error('Note save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      const note = await createNote(userId, '', '', []);
      setNotes((prev) => [note, ...prev]);
      openNote(note);
    } catch (err) {
      console.error('Create note failed:', err);
    }
  };

  const openNote = (note) => {
    setActiveNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setTags(note.tags || []);
    setTagInput('');
    setSaving(false);
    setSavedRecently(false);
  };

  const handleBack = () => {
    clearTimeout(saveTimer.current);
    doSave(activeNote, title, content, tags);
    setActiveNote(null);
    setTagInput('');
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNote?.id === id) { setActiveNote(null); setTagInput(''); }
    } catch {}
    setConfirmId(null);
  };

  const requestDelete = (id, e) => {
    e?.stopPropagation();
    setConfirmId(id);
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  // ── Editor view ───────────────────────────────────────────────────────────
  if (activeNote) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Editor header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={handleBack}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="flex-1 bg-transparent text-gray-900 dark:text-white font-semibold text-sm focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
          />
          {/* Save indicator */}
          <span className={`text-[10px] font-medium shrink-0 transition-opacity duration-300 ${
            saving ? 'text-gray-400 opacity-100' : savedRecently ? 'text-accent-500 opacity-100' : 'opacity-0'
          }`}>
            {saving ? 'Saving…' : 'Saved'}
          </span>
        </div>

        {/* Timestamps */}
        <div className="px-3 py-1.5 flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Created {formatDate(activeNote.created_at)}
          </span>
          <span className="text-[10px] text-gray-300 dark:text-gray-700">•</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Edited {formatRelative(activeNote.updated_at)}
          </span>
        </div>

        {/* Tags input */}
        <div className="px-3 pb-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 min-h-[32px]">
            {tags.map((tag) => (
              <TagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} />
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? 'Add tags (Enter to confirm)' : ''}
              className="flex-1 min-w-[80px] bg-transparent text-[11px] text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something…"
          className="flex-1 px-3 pb-3 bg-transparent text-gray-700 dark:text-gray-300 text-sm resize-none focus:outline-none min-h-0 leading-relaxed"
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  // Derived: all unique tags across notes
  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))];

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q);
    const matchesTag = !activeTag || (n.tags || []).includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const confirmNote = notes.find((n) => n.id === confirmId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {confirmId && (
        <ConfirmModal
          title="Delete note?"
          message={`"${confirmNote?.title || 'Untitled'}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteNote(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Notes
          {notes.length > 0 && (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
              {filteredNotes.length}{filteredNotes.length !== notes.length && `/${notes.length}`}
            </span>
          )}
        </h3>
        <button
          onClick={handleCreate}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      {notes.length > 0 && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-accent-500 focus-within:border-transparent transition-all">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex gap-1 px-3 pb-2 shrink-0 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                activeTag === tag
                  ? getTagColor(tag) + ' ring-2 ring-offset-1 ring-current'
                  : getTagColor(tag) + ' opacity-60 hover:opacity-100'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0 space-y-1">
        {loading ? (
          <NotesSkeleton />
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">No notes yet</p>
            <button onClick={handleCreate} className="mt-2 text-xs text-accent-500 hover:text-accent-400 font-medium">
              Create your first note
            </button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <svg className="w-7 h-7 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">No notes match your search</p>
            <button
              onClick={() => { setSearch(''); setActiveTag(''); }}
              className="mt-1.5 text-xs text-accent-500 hover:text-accent-400 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNote(note)}
              className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group transition-all"
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                  {note.title || <span className="text-gray-400 dark:text-gray-600 font-normal">Untitled</span>}
                </p>
                <button
                  onClick={(e) => requestDelete(note.id, e)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {note.content && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 leading-snug">
                  {note.content}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 dark:text-gray-600 shrink-0">
                  {formatRelative(note.updated_at)}
                </span>
                {(note.tags || []).map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
