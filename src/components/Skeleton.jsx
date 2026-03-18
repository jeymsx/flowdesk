export function SkeletonLine({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

export function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-4 w-28" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-7 w-7" />
          <SkeletonBlock className="h-7 w-7" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 w-full" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, col) => (
            <SkeletonBlock key={col} className="h-10 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function NotesSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <SkeletonLine className="h-4 w-16" />
        <SkeletonBlock className="h-6 w-6" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-2 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1">
          <SkeletonLine className="h-3 w-3/4" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="p-4 flex flex-col items-center justify-center h-full gap-3">
      <SkeletonBlock className="w-16 h-16 rounded-full" />
      <SkeletonLine className="h-4 w-24" />
      <SkeletonLine className="h-3 w-32" />
    </div>
  );
}

export default function Skeleton({ variant = 'widget' }) {
  if (variant === 'calendar') return <CalendarSkeleton />;
  if (variant === 'notes') return <NotesSkeleton />;
  return <WidgetSkeleton />;
}
