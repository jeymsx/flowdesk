import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Compact tag selector that shows a trigger button with selected count.
 * Clicking opens a floating popover with the full tag library as colored toggleable pills.
 *
 * Props:
 *   selected     string[]        — currently selected tag names
 *   onChange     fn              — called with new selected string[]
 *   tags         {id,name,color}[] — full tag library from tagsStore
 *   onCreateTag  fn(name)        — called when user creates a new tag
 */
export default function TagSelector({ selected = [], onChange, tags = [], onCreateTag }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter((t) => t !== name) : [...selected, name]);
  };

  const handleCreate = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const name = input.trim().replace(/,$/, '');
      if (!name) return;
      onCreateTag(name);
      if (!selected.includes(name)) onChange([...selected, name]);
      setInput('');
      setShowInput(false);
    } else if (e.key === 'Escape') {
      setInput('');
      setShowInput(false);
    }
  };

  const getPos = () => {
    if (!btnRef.current) return { top: 0, left: 0 };
    const r = btnRef.current.getBoundingClientRect();
    const popW = 224;
    let left = r.left;
    let top = r.bottom + 4;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (top + 200 > window.innerHeight - 8) top = r.top - 200 - 4;
    return { top, left, width: popW };
  };

  const tagColor = (tag) => tag.color || '#22c55e';

  return (
    <div>
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>

        {selected.length === 0 ? (
          <span className="text-gray-400">Add tags…</span>
        ) : (
          <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
            {selected.slice(0, 3).map((name) => {
              const tag = tags.find((t) => t.name === name);
              const c = tagColor(tag || {});
              return (
                <span
                  key={name}
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none"
                  style={{ backgroundColor: c + '25', color: c }}
                >
                  {name}
                </span>
              );
            })}
            {selected.length > 3 && (
              <span className="text-[10px] text-gray-400 font-medium">+{selected.length - 3}</span>
            )}
          </div>
        )}

        <svg
          className={`w-3 h-3 shrink-0 ml-auto text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover */}
      {open && createPortal(
        <div
          ref={popRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[10000] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3"
          style={getPos()}
        >
          {/* Tag pills */}
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {tags.length === 0 && !showInput && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 py-1">No tags yet</p>
            )}
            {tags.map((tag) => {
              const active = selected.includes(tag.name);
              const c = tagColor(tag);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.name)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                  style={
                    active
                      ? { backgroundColor: c, color: '#fff' }
                      : { backgroundColor: c + '20', color: c }
                  }
                >
                  {active && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {tag.name}
                </button>
              );
            })}

            {/* New tag input */}
            {showInput ? (
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleCreate}
                onBlur={() => { setInput(''); setShowInput(false); }}
                placeholder="Tag name…"
                className="px-2.5 py-1 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500 w-28"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowInput(true)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-400 hover:text-accent-500 border border-dashed border-gray-300 dark:border-gray-600 hover:border-accent-400 transition-colors"
              >
                + New
              </button>
            )}
          </div>

          {/* Selected summary at bottom */}
          {selected.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-red-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
