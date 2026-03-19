import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// Regular uploaded videos (not live streams) — swap IDs with any YouTube video ID you prefer
const STATIONS = [
  { id: '8nPOiusHRjc', title: 'Cozy Spring', emoji: '🌸' },
  { id: 'h8UpC5JbMU0', title: 'Nostalgia', emoji: '📼' },
  { id: 'JElyhCKzhWI', title: 'Vintage Jazz', emoji: '🎷' },
  { id: 'SllpB3W5f6s', title: 'Dark Academia', emoji: '📖' },
  { id: 'WPni755-Krg', title: 'Alpha Waves', emoji: '🧘' },
];

function buildSrc(id, autoplay = false) {
  return `https://www.youtube.com/embed/${id}?loop=1&playlist=${id}&rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`;
}

function extractYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function MusicWidget() {
  const [stationIdx, setStationIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customId, setCustomId] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const linkBtnRef = useRef(null);

  const isCustom = customId !== null && stationIdx === -1;
  const station = isCustom ? { id: customId, title: 'Custom', emoji: '🔗' } : STATIONS[stationIdx];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const id = extractYouTubeId(customUrl);
    if (!id) return;
    setCustomId(id);
    setStationIdx(-1);
    setAutoplay(true);
    setShowCustomInput(false);
    setCustomUrl('');
  };

  const changeStation = (delta) => {
    setAutoplay(true);
    setStationIdx((i) => (i + delta + STATIONS.length) % STATIONS.length);
  };

  const goToStation = (i) => {
    setAutoplay(true);
    setStationIdx(i);
    if (i !== -1) setCustomId(null);
  };

  return (
    <div className="h-full flex flex-col p-3 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Music
        </h3>
        <div className="flex items-center gap-1.5">
          <select
            value={stationIdx}
            onChange={(e) => goToStation(Number(e.target.value))}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {stationIdx === -1 && (
              <option value={-1} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                🔗 Custom
              </option>
            )}
            {STATIONS.map((s, i) => (
              <option key={i} value={i} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                {s.emoji} {s.title}
              </option>
            ))}
          </select>
          <button
            ref={linkBtnRef}
            onClick={() => setShowCustomInput((v) => !v)}
            title="Play custom YouTube URL"
            className={`p-1 rounded-lg transition-colors ${showCustomInput ? 'bg-accent-500/15 text-accent-500' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Custom URL popover */}
      {showCustomInput && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={() => { setShowCustomInput(false); setCustomUrl(''); }}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
            style={(() => {
              const r = linkBtnRef.current?.getBoundingClientRect();
              if (!r) return { left: 100, top: 100 };
              return {
                left: Math.max(8, Math.min(r.right - 288, window.innerWidth - 296)),
                top: Math.max(8, Math.min(r.bottom + 8, window.innerHeight - 180)),
              };
            })()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Custom YouTube URL</h4>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomUrl(''); }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCustomSubmit} className="space-y-2.5">
                <input
                  autoFocus
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowCustomInput(false)}
                  placeholder="Paste YouTube URL…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="w-full py-2 text-sm font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white rounded-xl transition-colors"
                >
                  Play
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* YouTube embed — fills available space */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-black">
        <iframe
          key={station.id}
          src={buildSrc(station.id, autoplay)}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={station.title}
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
        />
      </div>

      {/* Station controls */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={() => changeStation(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <div className="flex gap-1.5 items-center">
          {STATIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => goToStation(i)}
              title={s.title}
              className={`rounded-full transition-all duration-200 ${
                i === stationIdx
                  ? 'w-5 h-2 bg-accent-500'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => changeStation(1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
