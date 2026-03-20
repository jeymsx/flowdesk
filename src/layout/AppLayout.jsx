import { useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileWidgetsSheet from './MobileWidgetsSheet';
import MobileProfileSheet from './MobileProfileSheet';
import MobileCalendarView from '../features/calendar/MobileCalendarView';
import FocusTimerEngine from '../features/focus/FocusTimerEngine';
import FloatingTimer from '../features/focus/FloatingTimer';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../store/uiStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function AppLayout({ children }) {
  const { sidebarOpen, setSidebarOpen, mobileTab } = useUIStore(
    useShallow((s) => ({ sidebarOpen: s.sidebarOpen, setSidebarOpen: s.setSidebarOpen, mobileTab: s.mobileTab }))
  );
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  if (isMobile) {
    return (
      <>
        <FocusTimerEngine />
        <FloatingTimer />
        <div
          className={`${mobileTab === 'calendar' ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'} text-gray-900 dark:text-gray-100 overflow-hidden`}
          style={{
            height: '100dvh',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <main
            className={mobileTab === 'calendar' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}
            style={mobileTab === 'calendar' ? {
              height: 'calc(100dvh - env(safe-area-inset-top) - 64px - env(safe-area-inset-bottom))',
            } : {
              height: 'calc(100dvh - env(safe-area-inset-top))',
              paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
            }}
          >
            {mobileTab === 'calendar' ? <MobileCalendarView /> : children}
          </main>

          <MobileWidgetsSheet />
          <MobileProfileSheet />
          <MobileNav />
        </div>
      </>
    );
  }

  return (
    <>
      <FocusTimerEngine />
      <FloatingTimer />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
        <Sidebar />
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main
          className={`min-h-screen transition-all duration-300 ${
            sidebarOpen ? 'ml-60' : 'ml-16'
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
}
