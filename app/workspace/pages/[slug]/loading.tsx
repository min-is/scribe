export default function Loading() {
  return (
    <div className="h-full flex flex-col bg-main">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-8">
          {/* Loading skeleton */}
          <div className="mb-10 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
