import { useUIStore } from '../store/uiStore';

function HomeIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
      <path d="M12 3.5L4 9.2V20h5v-5.5a1 1 0 011-1h4a1 1 0 011 1V20h5V9.2L12 3.5z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
      <path d="M4 9.2L12 3.5l8 5.7V20h-5v-5.5a1 1 0 00-1-1h-4a1 1 0 00-1 1V20H4V9.2z" />
    </svg>
  );
}

function CalendarIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <rect x="8" y="2.5" width="2" height="5" rx="1" fill="white" opacity="0.9" />
      <rect x="14" y="2.5" width="2" height="5" rx="1" fill="white" opacity="0.9" />
      <rect x="3" y="10" width="18" height="1.5" fill="white" opacity="0.25" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M9 2.5v5M15 2.5v5M3 10.5h18" />
    </svg>
  );
}

function GridIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function PersonIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5H4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" />
    </svg>
  );
}

const TABS = [
  { id: 'home',     label: 'Home',     Icon: HomeIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'widgets',  label: 'Widgets',  Icon: GridIcon },
  { id: 'profile',  label: 'Profile',  Icon: PersonIcon },
];

export default function MobileNav() {
  const { mobileTab, setMobileTab, setShowMobileWidgets, setShowMobileProfile } = useUIStore();

  const handleTab = (id) => {
    if (id === 'widgets') {
      setShowMobileWidgets(true);
    } else if (id === 'profile') {
      setShowMobileProfile(true);
    } else {
      setMobileTab(id);
    }
  };

  return (
    <div
      className="fixed left-0 right-0 z-[9800] flex justify-center"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-full shadow-xl border border-gray-200/70 dark:border-gray-700/50 px-1 py-1.5">
        <div className="flex items-center">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = id !== 'widgets' && id !== 'profile' && mobileTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTab(id)}
                className={`flex flex-col items-center gap-[3px] px-5 py-1 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-accent-500/10' : 'active:bg-gray-100 dark:active:bg-gray-800/60'
                }`}
              >
                <span className={isActive ? 'text-accent-500' : 'text-gray-400 dark:text-gray-500'}>
                  <Icon active={isActive} />
                </span>
                <span className={`text-[9px] font-semibold leading-none ${isActive ? 'text-accent-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
