import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { sidebarOpen, setSidebarOpen, mobileTab, focusRunning, musicActive, leaveGuardPending, setLeaveGuardPending } = useUIStore(
    useShallow((s) => ({
      sidebarOpen: s.sidebarOpen,
      setSidebarOpen: s.setSidebarOpen,
      mobileTab: s.mobileTab,
      focusRunning: s.focusRunning,
      musicActive: s.musicActive,
      leaveGuardPending: s.leaveGuardPending,
      setLeaveGuardPending: s.setLeaveGuardPending,
    }))
  );
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  const leaveModal = leaveGuardPending !== null && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-80 max-w-[90vw]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Leave page?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {focusRunning && musicActive
                ? 'Your focus timer and music will stop.'
                : focusRunning
                ? 'Your focus timer is running and will stop.'
                : 'Your music will stop.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLeaveGuardPending(null)}
            className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
          >
            Stay
          </button>
          <button
            onClick={() => { navigate(leaveGuardPending); setLeaveGuardPending(null); }}
            className="flex-1 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <FocusTimerEngine />
        <FloatingTimer />
        {leaveModal}
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
      {leaveModal}
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
