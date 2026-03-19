/**
 * Shared tag input component.
 * Renders existing tags as removable chips + a text field.
 * Press Enter or comma to confirm a tag. Backspace on empty input removes the last tag.
 */
export default function TagInput({ tags = [], tagInput = '', onTagsChange, onTagInputChange, placeholder = 'Tags… press Enter' }) {
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,+$/, '');
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      onTagInputChange('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag) => onTagsChange(tags.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap gap-1 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[34px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-accent-500/15 text-accent-600 dark:text-accent-400 text-[10px] font-semibold rounded-full leading-none"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 hover:text-red-500 transition-colors leading-none"
            tabIndex={-1}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={tagInput}
        onChange={(e) => onTagInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
      />
    </div>
  );
}
