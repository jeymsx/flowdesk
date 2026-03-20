import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';

/**
 * A small swatch button that opens ONLY a hex color picker (no preset grid).
 * Use this alongside an existing preset swatch row.
 *
 * Props:
 *   color    string    — current hex color
 *   onChange fn        — called with new hex string
 *   size     'sm'|'md' — swatch size (default 'md': w-6 h-6, 'sm': w-5 h-5)
 *   presets  string[]  — list of preset colors; when color matches one,
 *                        the button shows a palette icon instead of the color
 */
export default function HexPickerBtn({ color, onChange, size = 'md', presets = [] }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(color);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const isCustom = !presets.includes(color);

  useEffect(() => { setHex(color); }, [color]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const popW = 192, popH = 200;
    let left = r.left;
    let top = r.bottom + 6;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (top + popH > window.innerHeight - 8) top = r.top - popH - 6;
    setPos({ top, left });
  }, []);

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

  const handleChange = (val) => { setHex(val); onChange(val); };
  const handleHexInput = (e) => {
    const val = e.target.value;
    setHex(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
  };

  const btnSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Custom color"
        className={`${btnSize} rounded-full flex items-center justify-center transition-transform hover:scale-110 shrink-0`}
        style={isCustom
          ? { backgroundColor: color, outline: `2px solid ${color}`, outlineOffset: 2 }
          : { border: '2px dashed #9ca3af' }}
      >
        {!isCustom && (
          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.61-1.59-.37-.41-.59-.96-.59-1.41 0-1.1.9-2 2-2h2c3.03 0 5.5-2.47 5.5-5.5C22.5 6.21 17.74 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5S18.33 11 17.5 11z" />
          </svg>
        )}
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[10000] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 w-48"
          style={pos}
        >
          <HexColorPicker color={hex} onChange={handleChange} style={{ width: '100%', height: 140 }} />
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
        </div>,
        document.body
      )}
    </>
  );
}

/** Returns true if the hex color is light (needs dark text on top). */
export function isLightColor(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance formula
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
