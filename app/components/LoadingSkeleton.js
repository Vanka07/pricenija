// Loading Skeleton Components for PriceNija
// These provide visual feedback while data is loading

export function DashboardSkeleton() {
    return (
          <div className="animate-pulse">
    {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 h-32">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-4"></div>
                                  <div className="h-8 bg-gray-700 rounded w-20 mb-2"></div>
                                  <div className="h-3 bg-gray-700 rounded w-16"></div>
      </div>
                              ))}
</div>

{/* Price Changes Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800/50 rounded-xl p-6 h-40">
                    <div className="h-5 bg-gray-700 rounded w-32 mb-4"></div>
                                 <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                                 <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
                             ))}
</div>
  </div>
  );
}

export function PriceListSkeleton() {
    return (
          <div className="animate-pulse space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                                     <div>
                    <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
                                       <div className="h-3 bg-gray-700 rounded w-20"></div>
      </div>
      </div>
                                   <div className="text-right">
                  <div className="h-6 bg-gray-700 rounded w-20 mb-2"></div>
                                     <div className="h-4 bg-gray-700 rounded w-12"></div>
      </div>
      </div>
                               ))}
</div>
  );
}

export function MarketCardSkeleton() {
    return (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="h-6 bg-gray-700 rounded w-24 mb-2"></div>
                                            <div className="h-4 bg-gray-700 rounded w-32"></div>
      </div>
                                          <div className="h-8 bg-gray-700 rounded-full w-16"></div>
      </div>
                                        <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
                                        <div className="flex justify-between">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                                          <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((j) => (
                          <div key={j} className="w-4 h-4 bg-gray-700 rounded"></div>
                                           ))}
</div>
  </div>
  </div>
        ))}
          </div>
          </div>
  );
}

export function ChartSkeleton() {
    return (
          <div className="animate-pulse bg-gray-800 rounded-xl p-6">
            <div className="h-6 bg-gray-700 rounded w-32 mb-6"></div>
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
}
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-800 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-9 w-20 bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>

      {/* Status Bar Skeleton */}
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Title */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="h-28 rounded-xl bg-red-500/20 animate-pulse" />
          <div className="h-28 rounded-xl bg-green-500/20 animate-pulse" />
          <div className="h-28 rounded-xl bg-orange-500/20 animate-pulse" />
          <div className="h-28 rounded-xl bg-purple-500/20 animate-pulse" />
        </div>

        {/* Three Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-gray-800/50 border border-gray-800 animate-pulse"
            />
          ))}
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse mx-auto" />
        </div>
      </footer>
    </div>
  );
}
// Page Loading Skeleton - wraps DashboardSkeleton for full page loading state
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6">
      <DashboardSkeleton />
    </div>
  );
}
