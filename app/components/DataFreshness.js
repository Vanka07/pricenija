'use client';

import { formatPriceDate, isPriceDataStale } from '../../lib/priceWindow';

export default function DataFreshness({ lastUpdated }) {
  if (!lastUpdated) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-500 rounded-full" />
        <span className="text-gray-400">Loading</span>
      </span>
    );
  }

  const stale = isPriceDataStale(lastUpdated);
  const asOf = formatPriceDate(lastUpdated);

  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${stale ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
      <span className={stale ? 'text-yellow-400' : 'text-green-400'}>
        Latest on record
      </span>
      {asOf && <span className="text-gray-500">As of {asOf}</span>}
    </span>
  );
}
