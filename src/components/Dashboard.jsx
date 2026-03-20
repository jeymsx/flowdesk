import { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useWidgetStore } from '../store/widgetStore';
import { useUIStore } from '../store/uiStore';
import { useMediaQuery } from '../hooks/useMediaQuery';
import WidgetCard from './WidgetCard';
import DemoSignupPrompt from './DemoSignupPrompt';
import CalendarWidget from '../features/calendar/CalendarWidget';
import NotesWidget from '../features/notes/NotesWidget';
import FocusWidget from '../features/focus/FocusWidget';
import MusicWidget from '../features/music/MusicWidget';
import TasksWidget from '../features/tasks/TasksWidget';
import ClockWidget from '../features/clock/ClockWidget';
import StreakWidget from '../features/streak/StreakWidget';
import MilestonesWidget from '../features/milestones/MilestonesWidget';
import BookmarksWidget from '../features/bookmarks/BookmarksWidget';
import { SkeletonBlock } from './Skeleton';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEMO_FREE_IDS = new Set(['music-1', 'focus-1', 'clock-1']);

const WIDGET_COMPONENTS = {
  calendar: CalendarWidget,
  notes: NotesWidget,
  focus: FocusWidget,
  music: MusicWidget,
  tasks: TasksWidget,
  clock: ClockWidget,
  streak: StreakWidget,
  milestones: MilestonesWidget,
  bookmarks: BookmarksWidget,
};

function DashboardSkeleton() {
  return (
    <div className="p-4 grid grid-cols-12 gap-4">
      <SkeletonBlock className="col-span-6 h-96 rounded-xl" />
      <SkeletonBlock className="col-span-3 h-64 rounded-xl" />
      <SkeletonBlock className="col-span-3 h-64 rounded-xl" />
    </div>
  );
}

export default function Dashboard() {
  const isDemo = useUIStore((s) => s.isDemo);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);
  const { layouts, initialized, onLayoutChange, getVisibleWidgets } = useWidgetStore();
  const layoutLocked = useUIStore((s) => s.layoutLocked);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const visibleWidgets = getVisibleWidgets();

  if (!initialized) return <DashboardSkeleton />;

  if (visibleWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No widgets visible</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Toggle widgets on from the sidebar</p>
      </div>
    );
  }

  const visibleIds = new Set(visibleWidgets.map((w) => w.id));
  const filteredLayouts = {};
  for (const [bp, items] of Object.entries(layouts)) {
    filteredLayouts[bp] = items.filter((item) => visibleIds.has(item.i));
  }

  return (
    <>
      <div className="p-2">
        <ResponsiveGridLayout
          layouts={filteredLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={56}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          isDraggable={!layoutLocked && !isDemo}
          isResizable={!layoutLocked && !isDemo}
          compactType="vertical"
          margin={isMobile ? [8, 16] : [12, 12]}
        >
          {visibleWidgets.map((widget) => {
            const Component = WIDGET_COMPONENTS[widget.type];
            if (!Component) return null;
            const locked = isDemo && !DEMO_FREE_IDS.has(widget.id);
            return (
              <div key={widget.id} className="relative">
                <WidgetCard>
                  <Component />
                </WidgetCard>
                {locked && (
                  <div
                    className="absolute inset-0 z-10 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 bg-gray-950/40 dark:bg-gray-950/60 backdrop-blur-[1px]"
                    onClick={() => setShowDemoPrompt(true)}
                  >
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Sign up to unlock</span>
                  </div>
                )}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
      {showDemoPrompt && <DemoSignupPrompt onClose={() => setShowDemoPrompt(false)} />}
    </>
  );
}
