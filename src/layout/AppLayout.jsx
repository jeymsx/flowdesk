import { useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileWidgetsSheet from './MobileWidgetsSheet';
import MobileProfileSheet from './MobileProfileSheet';
import MobileCalendarView from '../features/calendar/MobileCalendarView';
import { useUIStore } from '../store/uiStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function AppLayout({ children }) {
  const { sidebarOpen, setSidebarOpen, mobileTab } = useUIStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  if (isMobile) {
    return (
      <div
        className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
        style={{
          minHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Main content area — padding-bottom keeps content above floating nav */}
        <main
          className="overflow-y-auto"
          style={{
            height: 'calc(100dvh - env(safe-area-inset-top))',
            paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
          }}
        >
          {mobileTab === 'calendar' ? <MobileCalendarView /> : children}
        </main>

        {/* Bottom sheets */}
        <MobileWidgetsSheet />
        <MobileProfileSheet />

        {/* Bottom navigation */}
        <MobileNav />
      </div>
    );
  }

  return (
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
  );
}
