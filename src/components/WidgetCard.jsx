export default function WidgetCard({ children }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors">
      {/* Drag handle strip */}
      <div className="drag-handle flex items-center justify-center h-6 shrink-0 cursor-grab active:cursor-grabbing select-none border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-xl">
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[3px] h-[3px] rounded-full bg-gray-300 dark:bg-gray-600"
            />
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
