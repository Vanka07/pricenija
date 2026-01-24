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
