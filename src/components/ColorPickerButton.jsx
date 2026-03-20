import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';

export const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#000000',
];

/**
 * A compact color swatch that opens a popover with preset swatches + a custom hex picker.
 *
 * Props:
 *   color     string    — current hex color
 *   onChange  fn        — called with new hex string
 *   size      'sm'|'md' — swatch button size (default 'md')
 *   presets   string[]  — override default palette
 */
export default function ColorPickerButton({ color, onChange, size = 'md', presets = DEFAULT_COLORS }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [hex, setHex] = useState(color);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => { setHex(color); }, [color]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePickerChange = (val) => { setHex(val); onChange(val); };

  const handleHexInput = (e) => {
    const val = e.target.value;
    setHex(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
  };

  const selectPreset = (c) => { onChange(c); setHex(c); };

  const btnSize = size === 'tiny' ? 'w-3 h-3' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const btnStyle = size === 'tiny'
    ? 'rounded-full hover:scale-110 transition-transform shrink-0'
    : 'rounded-full border-2 border-white dark:border-gray-700 shadow ring-1 ring-gray-200 dark:ring-gray-600 hover:scale-110 transition-transform shrink-0';

  const [pos, setPos] = useState({ top: 0, left: 0 });

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const popW = 192;
    const popH = showCustom ? 340 : 140;
    let left = r.left;
    let top = r.bottom + 6;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (top + popH > window.innerHeight - 8) top = r.top - popH - 6;
    setPos({ top, left });
  }, [showCustom]);

  useEffect(() => {
    if (!open) return;
    calcPos();
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Pick color"
        className={`${btnSize} ${btnStyle} relative overflow-hidden`}
        style={{ backgroundColor: color }}
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/25 transition-opacity">
          <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </span>
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          className="fixed z-[10000] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 w-48"
          style={pos}
        >
          {/* Preset palette grid */}
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {presets.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectPreset(c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0 relative"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Custom toggle */}
          <button
            type="button"
            onClick={() => setShowCustom((s) => !s)}
            className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Custom</span>
            <svg className={`w-3 h-3 transition-transform ${showCustom ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCustom && (
            <div className="mt-2">
              <HexColorPicker color={hex} onChange={handlePickerChange} style={{ width: '100%', height: 140 }} />
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-5 h-5 rounded-md shrink-0 border border-gray-200 dark:border-gray-700" style={{ backgroundColor: hex }} />
                <input
                  type="text"
                  value={hex}
                  onChange={handleHexInput}
                  maxLength={7}
                  className="flex-1 px-2 py-1 text-[11px] font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent-500 uppercase"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
