import { useState, useEffect } from 'react';
import { useWidgetStore } from '../../store/widgetStore';

// ── Analog clock face ─────────────────────────────────────────────────────────

function handPoint(deg, length, cx = 100, cy = 100) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
}

function AnalogClock({ hours, minutes, seconds }) {
  const hourDeg = (hours % 12) * 30 + minutes * 0.5 + seconds * (0.5 / 60);
  const minDeg = minutes * 6 + seconds * 0.1;
  const secDeg = seconds * 6;

  const hour = handPoint(hourDeg, 52);
  const min = handPoint(minDeg, 68);
  const sec = handPoint(secDeg, 72);
  const secTail = handPoint(secDeg + 180, 18);

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <circle cx={100} cy={100} r={92} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-gray-100 dark:text-gray-800" />
      {Array.from({ length: 12 }, (_, i) => {
        const p1 = handPoint(i * 30, 86);
        const p2 = handPoint(i * 30, 76);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="text-gray-400 dark:text-gray-500" />;
      })}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const p1 = handPoint(i * 6, 86);
        const p2 = handPoint(i * 6, 82);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="text-gray-200 dark:text-gray-700" />;
      })}
      <line x1={100} y1={100} x2={hour.x} y2={hour.y} stroke="currentColor" strokeWidth={5} strokeLinecap="round" className="text-gray-800 dark:text-white" />
      <line x1={100} y1={100} x2={min.x} y2={min.y} stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" className="text-gray-700 dark:text-gray-200" />
      <line x1={secTail.x} y1={secTail.y} x2={sec.x} y2={sec.y} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-accent-500" />
      <circle cx={100} cy={100} r={5} fill="currentColor" className="text-gray-800 dark:text-white" />
      <circle cx={100} cy={100} r={2.5} fill="currentColor" className="text-accent-500" />
    </svg>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const [showAnalog, setShowAnalog] = useState(
    () => localStorage.getItem('clock-show-analog') !== 'false'
  );
  const { setWidgetHeight, layouts } = useWidgetStore((s) => ({ setWidgetHeight: s.setWidgetHeight, layouts: s.layouts }));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleAnalog = () => {
    const next = !showAnalog;
    localStorage.setItem('clock-show-analog', String(next));
    if (!next) {
      // Switching to digital-only: shrink to compact height
      setWidgetHeight('clock-1', 3);
    } else {
      // Switching to analog: only grow if current height is too short to show the face
      const currentH = layouts.lg?.find((item) => item.i === 'clock-1')?.h ?? 0;
      if (currentH < 5) setWidgetHeight('clock-1', 5);
    }
    setShowAnalog(next);
  };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMins = -now.getTimezoneOffset();
  const offsetSign = offsetMins >= 0 ? '+' : '-';
  const absH = String(Math.floor(Math.abs(offsetMins) / 60)).padStart(2, '0');
  const absM = String(Math.abs(offsetMins) % 60).padStart(2, '0');
  const utcOffset = `UTC${offsetSign}${absH}:${absM}`;
  const tzCity = timezone.split('/').pop().replace(/_/g, ' ');

  const digitalTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Clock
        </h3>
        <button
          onClick={toggleAnalog}
          title={showAnalog ? 'Hide analog clock' : 'Show analog clock'}
          className={`p-1 rounded-lg transition-colors ${
            showAnalog
              ? 'bg-accent-500/15 text-accent-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white'
          }`}
        >
          {/* Circle/clock icon */}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </svg>
        </button>
      </div>

      {/* Analog face — only when toggled on */}
      {showAnalog && (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full h-full" style={{ maxWidth: '160px', maxHeight: '160px' }}>
            <AnalogClock
              hours={now.getHours()}
              minutes={now.getMinutes()}
              seconds={now.getSeconds()}
            />
          </div>
        </div>
      )}

      {/* Digital readout */}
      <div className={`text-center shrink-0 space-y-0.5 ${!showAnalog ? 'flex-1 flex flex-col items-center justify-center' : ''}`}>
        <p className="text-xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
          {digitalTime}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dateStr}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{tzCity} · {utcOffset}</p>
      </div>
    </div>
  );
}
