import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useWidgetStore } from '../store/widgetStore';
import BottomSheet from './BottomSheet';
import ConfirmModal from '../components/ConfirmModal';

const WIDGET_ICONS = {
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  notes: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  focus: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  music: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  streak: 'M13 10V3L4 14h7v7l9-11h-7z',
  milestones: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2',
  bookmarks: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
};

export default function MobileWidgetsSheet() {
  const { showMobileWidgets, setShowMobileWidgets, focusRunning } = useUIStore();
  const { allWidgets, visibleWidgetIds, toggleWidget, resetLayout } = useWidgetStore();
  const [warnFocusHide, setWarnFocusHide] = useState(false);

  return (
    <>
      <BottomSheet
        open={showMobileWidgets}
        onClose={() => setShowMobileWidgets(false)}
        title="Widgets"
      >
        <div className="px-4 py-3 space-y-1">
          {allWidgets.map((widget) => {
            const visible = visibleWidgetIds.includes(widget.id);
            return (
              <button
                key={widget.id}
                onClick={() => {
                  if (widget.id === 'focus-1' && visible && focusRunning) {
                    setWarnFocusHide(true);
                    return;
                  }
                  toggleWidget(widget.id);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${
                  visible
                    ? 'bg-accent-500/8 text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: visible ? '#22c55e' : undefined }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={WIDGET_ICONS[widget.type] || ''} />
                </svg>
                <span className="flex-1 text-left text-sm font-medium">{widget.label}</span>
                {/* Toggle indicator */}
                <div className={`w-11 h-6 rounded-full transition-colors ${visible ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full m-0.5 shadow-sm transition-transform ${visible ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            );
          })}

          {/* Reset layout */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
            <button
              onClick={resetLayout}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Reset Layout</span>
            </button>
          </div>

          {/* Safe area bottom padding */}
          <div style={{ height: 'env(safe-area-inset-bottom)' }} />
        </div>
      </BottomSheet>

      {warnFocusHide && (
        <ConfirmModal
          title="Focus timer is running"
          message="Hiding the widget will stop your active timer session. Are you sure?"
          confirmLabel="Hide anyway"
          onConfirm={() => { toggleWidget('focus-1'); setWarnFocusHide(false); }}
          onCancel={() => setWarnFocusHide(false)}
        />
      )}
    </>
  );
}
