import { useState } from 'react';

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

export default function MusicWidget() {
  const [stationIdx, setStationIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  const station = STATIONS[stationIdx];

  const changeStation = (delta) => {
    setAutoplay(true);
    setStationIdx((i) => (i + delta + STATIONS.length) % STATIONS.length);
  };

  const goToStation = (i) => {
    setAutoplay(true);
    setStationIdx(i);
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
        <select
          value={stationIdx}
          onChange={(e) => goToStation(Number(e.target.value))}
          className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {STATIONS.map((s, i) => (
            <option key={i} value={i} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              {s.emoji} {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* YouTube embed — fills available space */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-black">
        <iframe
          key={stationIdx}
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
