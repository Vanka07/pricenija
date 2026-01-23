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
