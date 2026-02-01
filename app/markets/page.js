'use client';

import { useState } from 'react';
import { MapPin, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import useMarketData from '../hooks/useMarketData';
import PageShell from '../components/PageShell';

export default function MarketsPage() {
  return <MarketsPageContent />;
}

function MarketsPageContent() {
  const {
    user, markets,
    loading, error, lastUpdated, refreshing,
    handleRefresh, fetchData,
    getPriceData, topGainers, topLosers,
  } = useMarketData();

  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <PageShell user={user} lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={handleRefresh}
        showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-green-400" size={40} />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell user={user} lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={handleRefresh}
        showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button onClick={() => fetchData()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg">
              Try Again
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      user={user}
      topGainers={topGainers}
      topLosers={topLosers}
      lastUpdated={lastUpdated}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      showAuthModal={showAuthModal}
      setShowAuthModal={setShowAuthModal}
    >
      <div className="space-y-4 sm:space-y-6 tab-content">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Markets Directory</h1>
          <p className="text-gray-400 text-sm sm:text-base">Major commodity markets across Nigeria</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {markets.map((market) => {
            const marketData = getPriceData.marketPrices[market.id];
            return (
              <Link href={"/markets/" + market.id} key={market.id} className="group">
                <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold line-clamp-2 leading-tight group-hover:text-green-400 transition-colors">{market.name}</h3>
                      <p className="text-gray-400 flex items-center gap-1 mt-1 text-sm">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{market.city}, {market.state}</span>
                      </p>
                    </div>
                    {marketData && (
                      <span className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium flex-shrink-0 ml-2
                        ${marketData.avgChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {marketData.avgChange >= 0 ? '+' : ''}{marketData.avgChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{market.description}</p>
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-800">
                    <span className="text-xs sm:text-sm text-gray-400">{market.region}</span>
                    <span className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      View details <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
