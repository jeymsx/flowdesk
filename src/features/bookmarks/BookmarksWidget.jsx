import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBookmarksStore } from '../../store/bookmarksStore';
import { useAuthStore } from '../../store/authStore';
import ConfirmModal from '../../components/ConfirmModal';

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeUrl(url) {
  if (!url) return url;
  if (/^javascript:/i.test(url)) return 'https://';
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
  } catch { return null; }
}

function getDateLabel(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const item  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff  = Math.round((today - item) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return d.toLocaleDateString('en-US', { weekday: 'long' });
  if (d.getFullYear() === now.getFullYear())
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(items) {
  const map = new Map();
  for (const b of items) {
    const label = getDateLabel(b.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(b);
  }
  return [...map.entries()];
}

// ── Icons ──────────────────────────────────────────────────────────────────

function StarIcon({ filled, size = 'w-3.5 h-3.5' }) {
  return filled ? (
    <svg className={`${size} text-yellow-400`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg className={`${size}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

// ── Favicon ────────────────────────────────────────────────────────────────

function Favicon({ url, size = 16 }) {
  const [err, setErr] = useState(false);
  const src = getFaviconUrl(url);
  if (!src || err) {
    return (
      <span className="shrink-0 flex items-center justify-center text-gray-400" style={{ width: size, height: size }}>
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </span>
    );
  }
  return <img src={src} width={size} height={size} className="rounded-sm shrink-0 object-contain" onError={() => setErr(true)} alt="" />;
}

// ── Row (defined at module level to avoid remount bug) ─────────────────────

function BookmarkRow({ b, isEditing, onStartEdit, onDelete, onToggleFavorite }) {
  return (
    <div className={`group flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${isEditing ? 'bg-accent-500/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
      <div className="mt-0.5 shrink-0"><Favicon url={b.url} size={15} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <a href={b.url} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-gray-800 dark:text-gray-100 hover:text-accent-500 dark:hover:text-accent-400 truncate transition-colors">
            {b.title || getDomain(b.url)}
          </a>
          {b.favorite && <StarIcon filled size="w-3 h-3" />}
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{getDomain(b.url)}</p>
        {b.annotation && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 italic">{b.annotation}</p>
        )}
        {b.folder && (
          <span className="inline-block text-[9px] px-1.5 py-0.5 mt-1 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 font-medium">
            {b.folder}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onToggleFavorite(b.id, b.favorite)}
          className={`p-1 rounded transition-colors ${b.favorite ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
          title={b.favorite ? 'Unstar' : 'Star'}>
          <StarIcon filled={b.favorite} />
        </button>
        <button onClick={(e) => onStartEdit(b, e.currentTarget)} className="p-1 text-gray-400 hover:text-accent-500 rounded transition-colors" title="Edit">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(b.id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors" title="Delete">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function BookmarkCard({ b, isEditing, onStartEdit, onDelete, onToggleFavorite }) {
  return (
    <div className={`group flex flex-col gap-2 p-3 rounded-xl border transition-all ${isEditing ? 'border-accent-500/40 bg-accent-500/5' : 'bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60 hover:border-accent-500/40 hover:shadow-sm'}`}>
      <div className="flex items-start gap-2 min-w-0">
        <Favicon url={b.url} size={18} />
        <div className="flex-1 min-w-0">
          <a href={b.url} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold text-gray-800 dark:text-gray-100 hover:text-accent-500 dark:hover:text-accent-400 line-clamp-2 leading-snug transition-colors block">
            {b.title || getDomain(b.url)}
          </a>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">{getDomain(b.url)}</p>
        </div>
      </div>
      {b.annotation && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 italic leading-relaxed">{b.annotation}</p>
      )}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          {b.folder
            ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 font-medium">{b.folder}</span>
            : <span />}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onToggleFavorite(b.id, b.favorite)}
            className={`p-1 rounded transition-colors ${b.favorite ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
            title={b.favorite ? 'Unstar' : 'Star'}>
            <StarIcon filled={b.favorite} />
          </button>
          <button onClick={(e) => onStartEdit(b, e.currentTarget)} className="p-1 text-gray-400 hover:text-accent-500 rounded transition-colors" title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => onDelete(b.id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors" title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Date section label ─────────────────────────────────────────────────────

function DateLabel({ label }) {
  return (
    <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
      {label}
    </p>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────

export default function BookmarksWidget() {
  const user = useAuthStore((s) => s.user);
  const { bookmarks, loading, load, addBookmark, updateBookmark, deleteBookmark, toggleFavorite } = useBookmarksStore();

  const [view, setView] = useState('list');
  const [activeFolder, setActiveFolder] = useState('all');

  // Add popover
  const [showAdd, setShowAdd] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addAnnotation, setAddAnnotation] = useState('');
  const [addFolder, setAddFolder] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const addBtnRef = useRef(null);

  // Edit popover
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ url: '', title: '', annotation: '', folder: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editAnchorEl, setEditAnchorEl] = useState(null);

  // Delete confirm
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { if (user) load(user.id); }, [user, load]);

  // Popover positions — track anchor on scroll/resize
  const [addPopPos, setAddPopPos] = useState({ left: 100, top: 100 });
  const calcAddPos = useCallback(() => {
    const r = addBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    setAddPopPos({ left: Math.max(8, Math.min(r.right - 320, window.innerWidth - 328)), top: Math.max(8, Math.min(r.bottom + 8, window.innerHeight - 460)) });
  }, []);
  useEffect(() => {
    if (!showAdd) return;
    calcAddPos();
    window.addEventListener('scroll', calcAddPos, true);
    window.addEventListener('resize', calcAddPos);
    return () => { window.removeEventListener('scroll', calcAddPos, true); window.removeEventListener('resize', calcAddPos); };
  }, [showAdd, calcAddPos]);

  const [editPopPos, setEditPopPos] = useState({ left: 100, top: 100 });
  const calcEditPos = useCallback(() => {
    if (!editAnchorEl) return;
    const r = editAnchorEl.getBoundingClientRect();
    setEditPopPos({ left: Math.max(8, Math.min(r.right - 320, window.innerWidth - 328)), top: Math.max(8, Math.min(r.bottom + 8, window.innerHeight - 420)) });
  }, [editAnchorEl]);
  useEffect(() => {
    if (!editId || !editAnchorEl) return;
    calcEditPos();
    window.addEventListener('scroll', calcEditPos, true);
    window.addEventListener('resize', calcEditPos);
    return () => { window.removeEventListener('scroll', calcEditPos, true); window.removeEventListener('resize', calcEditPos); };
  }, [editId, editAnchorEl, calcEditPos]);

  // Derived
  const folders = [...new Set(bookmarks.map((b) => b.folder).filter(Boolean))].sort();

  const filtered = activeFolder === 'all'
    ? bookmarks
    : bookmarks.filter((b) => b.folder === activeFolder);

  const favorites = filtered.filter((b) => b.favorite);
  const others = filtered.filter((b) => !b.favorite);
  const dateGroups = groupByDate(others);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const closeAdd = () => {
    setShowAdd(false);
    setAddUrl(''); setAddTitle(''); setAddAnnotation(''); setAddFolder(''); setAddError('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addUrl.trim()) return;
    setAddSaving(true);
    setAddError('');
    try {
      await addBookmark(user.id, {
        url: normalizeUrl(addUrl.trim()),
        title: addTitle.trim() || getDomain(normalizeUrl(addUrl.trim())),
        annotation: addAnnotation.trim(),
        folder: addFolder.trim() || null,
      });
      closeAdd();
    } catch {
      setAddError('Failed to save. Please try again.');
    } finally {
      setAddSaving(false);
    }
  };

  const startEdit = (b, anchorEl) => {
    setEditId(b.id);
    setEditForm({ url: b.url, title: b.title, annotation: b.annotation || '', folder: b.folder || '' });
    setEditAnchorEl(anchorEl || null);
    setShowAdd(false);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      await updateBookmark(editId, {
        url: normalizeUrl(editForm.url.trim()),
        title: editForm.title.trim() || getDomain(normalizeUrl(editForm.url.trim())),
        annotation: editForm.annotation.trim(),
        folder: editForm.folder.trim() || null,
      });
      setEditId(null);
    } catch {
      setEditError('Failed to save. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await deleteBookmark(id);
      if (editId === id) setEditId(null);
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  // ── Shared row/card props ──────────────────────────────────────────────────

  const rowProps = (b) => ({
    b,
    isEditing: editId === b.id,
    onStartEdit: startEdit,
    onDelete: (id) => setConfirmId(id),
    onToggleFavorite: toggleFavorite,
  });

  const INPUT_CLS = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Delete confirm */}
      {confirmId && (
        <ConfirmModal
          title="Delete bookmark?"
          message="This bookmark will be permanently removed."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Bookmarks
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setView('list')}
            className={`p-1 rounded transition-colors ${view === 'list' ? 'text-accent-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            title="List view">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button onClick={() => setView('card')}
            className={`p-1 rounded transition-colors ${view === 'card' ? 'text-accent-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            title="Card view">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            ref={addBtnRef}
            onClick={() => setShowAdd((v) => !v)}
            className="ml-1 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            title="Add bookmark"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add popover */}
      {showAdd && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={closeAdd}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-80 overflow-hidden"
            style={addPopPos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Bookmark</h4>
                <button onClick={closeAdd} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-2.5">
                <input
                  autoFocus
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeAdd()}
                  placeholder="https://example.com"
                  required
                  maxLength={2000}
                  className={INPUT_CLS}
                />
                <input
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeAdd()}
                  placeholder="Title (optional — defaults to domain)"
                  maxLength={200}
                  className={INPUT_CLS}
                />
                <textarea
                  value={addAnnotation}
                  onChange={(e) => setAddAnnotation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeAdd()}
                  placeholder="Annotation (optional)"
                  rows={2}
                  className={`${INPUT_CLS} resize-none`}
                />
                <div>
                  <input
                    value={addFolder}
                    onChange={(e) => setAddFolder(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && closeAdd()}
                    list="bm-folders-add"
                    placeholder="Folder (optional)"
                    className={INPUT_CLS}
                  />
                  <datalist id="bm-folders-add">
                    {folders.map((f) => <option key={f} value={f} />)}
                  </datalist>
                </div>
                {addError && (
                  <p className="text-xs text-red-500 text-center">{addError}</p>
                )}
                <button
                  type="submit"
                  disabled={addSaving || !addUrl.trim()}
                  className="w-full py-2 text-sm font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  {addSaving ? 'Saving…' : 'Add Bookmark'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit popover */}
      {editId && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={() => setEditId(null)}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-80 overflow-hidden"
            style={editPopPos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Bookmark</h4>
                <button onClick={() => setEditId(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-2.5">
                <input autoFocus value={editForm.url} onChange={(e) => handleEditChange('url', e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setEditId(null)} placeholder="https://example.com" className={INPUT_CLS} />
                <input value={editForm.title} onChange={(e) => handleEditChange('title', e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setEditId(null)} placeholder="Title (optional — defaults to domain)" className={INPUT_CLS} />
                <textarea value={editForm.annotation} onChange={(e) => handleEditChange('annotation', e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setEditId(null)} placeholder="Annotation (optional)" rows={2} className={`${INPUT_CLS} resize-none`} />
                <div>
                  <input value={editForm.folder} onChange={(e) => handleEditChange('folder', e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setEditId(null)} list="bm-folders-edit" placeholder="Folder (optional)" className={INPUT_CLS} />
                  <datalist id="bm-folders-edit">
                    {folders.map((f) => <option key={f} value={f} />)}
                  </datalist>
                </div>
                {editError && (
                  <p className="text-xs text-red-500 text-center">{editError}</p>
                )}
                <button type="submit" disabled={editSaving} className="w-full py-2 text-sm font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl transition-colors">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Folder tabs */}
      {folders.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto shrink-0 scrollbar-none">
          {['all', ...folders].map((f) => (
            <button key={f} onClick={() => setActiveFolder(f)}
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                activeFolder === f
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gray-100 dark:bg-gray-800 shrink-0" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-gray-400">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {activeFolder !== 'all' ? 'No bookmarks in this folder' : 'No bookmarks yet'}
            </p>
            {activeFolder === 'all' && (
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Click + to save your first link</p>
            )}
          </div>
        ) : view === 'list' ? (
          <div className="py-1">
            {/* Starred section */}
            {favorites.length > 0 && (
              <>
                <p className="px-2.5 pt-1.5 pb-1 text-[9px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1">
                  <StarIcon filled size="w-3 h-3" /> Starred
                </p>
                {favorites.map((b) => <BookmarkRow key={b.id} {...rowProps(b)} />)}
                {others.length > 0 && <div className="mx-3 my-1 h-px bg-gray-100 dark:bg-gray-800" />}
              </>
            )}
            {/* Date-grouped sections */}
            {dateGroups.map(([label, items]) => (
              <div key={label}>
                <DateLabel label={label} />
                {items.map((b) => <BookmarkRow key={b.id} {...rowProps(b)} />)}
              </div>
            ))}
          </div>
        ) : (
          // Card view
          <div className="p-2 space-y-2">
            {favorites.length > 0 && (
              <div>
                <p className="pb-1 pt-0.5 text-[9px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1 px-1">
                  <StarIcon filled size="w-3 h-3" /> Starred
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {favorites.map((b) => <BookmarkCard key={b.id} {...rowProps(b)} />)}
                </div>
                {others.length > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800 mt-2" />}
              </div>
            )}
            {dateGroups.map(([label, items]) => (
              <div key={label}>
                <DateLabel label={label} />
                <div className="grid grid-cols-2 gap-2">
                  {items.map((b) => <BookmarkCard key={b.id} {...rowProps(b)} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
