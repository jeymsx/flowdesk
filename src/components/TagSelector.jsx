import { useState } from 'react';

/**
 * Shared tag selector.
 * Shows the user's tag library as toggleable pills.
 * Clicking a tag selects/deselects it. A small inline input lets the user
 * create a new tag on the fly (which is added to the library AND selected).
 *
 * Props:
 *   selected     string[]   — currently selected tag names
 *   onChange     fn         — called with the new selected string[]
 *   tags         {id,name}[] — full tag library from tagsStore
 *   onCreateTag  fn(name)   — called when user creates a new tag
 */
export default function TagSelector({ selected = [], onChange, tags = [], onCreateTag }) {
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter((t) => t !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const handleCreate = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const name = input.trim().replace(/,$/, '');
      if (!name) return;
      onCreateTag(name);
      // Optimistically select it
      if (!selected.includes(name)) onChange([...selected, name]);
      setInput('');
      setShowInput(false);
    } else if (e.key === 'Escape') {
      setInput('');
      setShowInput(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => {
          const active = selected.includes(tag.name);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.name)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                active
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag.name}
            </button>
          );
        })}

        {showInput ? (
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCreate}
            onBlur={() => { setInput(''); setShowInput(false); }}
            placeholder="Tag name…"
            className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500 w-24"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-gray-400 hover:text-accent-500 border border-dashed border-gray-300 dark:border-gray-600 hover:border-accent-400 transition-colors"
          >
            + New
          </button>
        )}
      </div>
    </div>
  );
}
