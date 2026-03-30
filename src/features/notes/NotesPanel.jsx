import { useState, useEffect } from 'react';
import { useNotesStore } from '../../store/notesStore';
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
          x
        </button>
      )}
    </span>
  );
}

export default function NotesPanel({ mode = 'widget', supportsPiP = false, onPopOut, onClosePopOut }) {
  const {
    notes,
    loading,
    activeNoteId,
    draftTitle,
    draftContent,
    draftTags,
    isSaving,
    savedRecently,
    isNotesPopped,
    openNote,
    createAndOpenNote,
    closeActiveNote,
    updateDraft,
    deleteNote,
  } = useNotesStore();

  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const activeNote = notes.find((note) => note.id === activeNoteId) || null;
  const showEditor = !!activeNote && (mode === 'pip' || !isNotesPopped);

  useEffect(() => {
    if (!activeNoteId) setTagInput('');
  }, [activeNoteId]);

  const handleCreate = async () => {
    await createAndOpenNote();
  };

  const handleBack = async () => {
    await closeActiveNote();
    setTagInput('');
  };

  const requestDelete = (id, e) => {
    e?.stopPropagation();
    setConfirmId(id);
  };

  const handleDeleteNote = async (id) => {
    await deleteNote(id);
    setConfirmId(null);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (newTag && !draftTags.includes(newTag)) {
        updateDraft({ tags: [...draftTags, newTag] });
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && draftTags.length > 0) {
      updateDraft({ tags: draftTags.slice(0, -1) });
    }
  };

  const removeTag = (tag) => updateDraft({ tags: draftTags.filter((entry) => entry !== tag) });

  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))];
  const filteredNotes = notes.filter((note) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (note.title || '').toLowerCase().includes(q) ||
      (note.content || '').toLowerCase().includes(q);
    const matchesTag = !activeTag || (note.tags || []).includes(activeTag);
    return matchesSearch && matchesTag;
  });
  const confirmNote = notes.find((note) => note.id === confirmId);

  if (showEditor) {
    return (
      <div className="h-full flex flex-col overflow-hidden min-h-0">
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
            value={draftTitle}
            onChange={(e) => updateDraft({ title: e.target.value })}
            placeholder="Untitled"
            className="flex-1 bg-transparent text-gray-900 dark:text-white font-semibold text-sm focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
          />
          {mode === 'pip' && (
            <button
              onClick={onClosePopOut}
              title="Close pop-out"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <span className={`text-[10px] font-medium shrink-0 transition-opacity duration-300 ${
            isSaving ? 'text-gray-400 opacity-100' : savedRecently ? 'text-accent-500 opacity-100' : 'opacity-0'
          }`}>
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
        </div>

        <div className="px-3 py-1.5 flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Created {formatDate(activeNote.created_at)}
          </span>
          <span className="text-[10px] text-gray-300 dark:text-gray-700">|</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Edited {formatRelative(activeNote.updated_at)}
          </span>
        </div>

        <div className="px-3 pb-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 min-h-[32px]">
            {draftTags.map((tag) => (
              <TagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} />
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={draftTags.length === 0 ? 'Add tags (Enter to confirm)' : ''}
              className="flex-1 min-w-[80px] bg-transparent text-[11px] text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
            />
          </div>
        </div>

        <textarea
          value={draftContent}
          onChange={(e) => updateDraft({ content: e.target.value })}
          placeholder="Write something..."
          className="flex-1 px-3 pb-3 bg-transparent text-gray-700 dark:text-gray-300 text-sm resize-none focus:outline-none min-h-0 leading-relaxed"
        />
      </div>
    );
  }

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
        <div className="flex items-center gap-1">
          {mode === 'widget' && supportsPiP && (
            <button
              onClick={onPopOut}
              title="Pop out notes"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
          {mode === 'pip' && (
            <button
              onClick={onClosePopOut}
              title="Close pop-out"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={handleCreate}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

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
              placeholder="Search notes..."
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

      {allTags.length > 0 && (
        <div className="flex gap-1 px-3 pb-2 shrink-0 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                activeTag === tag
                  ? `${getTagColor(tag)} ring-2 ring-offset-1 ring-current`
                  : `${getTagColor(tag)} opacity-60 hover:opacity-100`
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

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
