import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGamificationStore } from '../../store/gamificationStore';

function Toast({ id, amount, reason }) {
  const [visible, setVisible] = useState(false);
  const dismiss = useGamificationStore((s) => s.dismissToast);

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Slide out after 2.2s, then remove
    const t2 = setTimeout(() => setVisible(false), 2200);
    const t3 = setTimeout(() => dismiss(id), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [id, dismiss]);

  return (
    <div
      className={`flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-xl shadow-xl text-sm font-semibold transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <span className="text-yellow-400 text-base leading-none">⚡</span>
      <span>+{amount} XP</span>
      {reason && (
        <span className="text-xs font-normal opacity-70">{reason}</span>
      )}
    </div>
  );
}

export default function XPToastManager() {
  const toasts = useGamificationStore((s) => s.xpToasts);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>,
    document.body
  );
}
