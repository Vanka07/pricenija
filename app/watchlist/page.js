'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Minus,
  Star, StarOff, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import useMarketData from '../hooks/useMarketData';
import PageShell from '../components/PageShell';
import Sparkline from '../components/Sparkline';

export default function WatchlistPage() {
  return <WatchlistPageContent />;
}

function WatchlistPageContent() {
  const {
    user, commodities,
    watchlist, toggleWatchlist, isInWatchlist,
    loading, error, lastUpdated, refreshing,
    handleRefresh, fetchData,
    getCommodityIcon, getPriceData,
    topGainers, topLosers,
    formatPrice, formatCompactPrice,
  } = useMarketData();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const watchlistItems = useMemo(() =>
    watchlist.map(id => getPriceData.commodityPrices[id]).filter(Boolean), [watchlist, getPriceData]);

  const renderChangeIndicator = (change) => {
    if (change > 0) return <span className="text-green-400 flex items-center gap-1"><ArrowUpRight size={14} />+{change.toFixed(1)}%</span>;
    if (change < 0) return <span className="text-red-400 flex items-center gap-1"><ArrowDownRight size={14} />{change.toFixed(1)}%</span>;
    return <span className="text-gray-400 flex items-center gap-1"><Minus size={14} />0%</span>;
  };

  const handleToggleWatchlist = async (commodityId) => {
    const result = await toggleWatchlist(commodityId);
    if (result?.needsAuth) setShowAuthModal(true);
  };

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
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Your Watchlist</h1>
          <p className="text-gray-400 text-sm sm:text-base">Track your favorite commodities</p>
        </div>

        {!user ? (
          <div className="bg-gray-900 rounded-2xl p-8 sm:p-12 text-center border border-gray-800">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
                <Star className="text-yellow-500" size={32} />
              </div>
              <div className="absolute -top-1 -right-1 text-yellow-400 animate-bounce text-sm" style={{ animationDelay: '0.1s' }}>&#10022;</div>
              <div className="absolute -bottom-1 -left-1 text-yellow-500 animate-bounce text-xs" style={{ animationDelay: '0.3s' }}>&#10022;</div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Track Your Favorite Commodities</h3>
            <p className="text-gray-400 mb-6 text-sm sm:text-base max-w-md mx-auto">
              Create a free account to save commodities, compare prices across markets, and get notified about price changes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setShowAuthModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]">
                Create Free Account
              </button>
              <Link href="/prices"
                className="text-gray-400 hover:text-white px-6 py-2.5 rounded-xl font-medium transition border border-gray-700 hover:border-gray-600 text-center">
                Browse Prices First
              </Link>
            </div>
          </div>
        ) : watchlistItems.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 sm:p-12 text-center border border-gray-800">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gray-800 rounded-full" />
              <div className="absolute inset-2 bg-gray-850 rounded-full flex items-center justify-center">
                <StarOff className="text-gray-500" size={32} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Your Watchlist is Empty</h3>
            <p className="text-gray-400 mb-2 text-sm sm:text-base max-w-md mx-auto">
              Start tracking commodities by clicking the <Star size={14} className="inline text-yellow-400" fill="currentColor" /> star icon on any commodity.
            </p>
            <p className="text-gray-500 text-xs mb-6">You&apos;ll see price changes and trends here at a glance.</p>
            <Link href="/prices"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]">
              Browse Commodities
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {watchlistItems.map((item) => (
              <div key={item.commodity.id} className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">{getCommodityIcon(item.commodity)}</span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-lg truncate">{item.commodity.name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{item.commodity.unit}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleWatchlist(item.commodity.id)}
                    className="text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-all flex-shrink-0 ml-2">
                    <Star fill="currentColor" />
                  </button>
                </div>
                {/* Sparkline */}
                {item.sparkline?.length >= 2 && (
                  <div className="mb-3 bg-gray-800/50 rounded-lg p-2">
                    <Sparkline data={item.sparkline} color={item.change >= 0 ? '#22c55e' : '#ef4444'} width={260} height={32} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs sm:text-sm">Avg Price</p>
                    <p className="text-base sm:text-lg font-bold">{formatPrice(item.avgPrice)}</p>
                    <div className="mt-1">{renderChangeIndicator(item.change)}</div>
                  </div>
                  <div className="bg-green-900/30 rounded-xl p-3 border border-green-800">
                    <p className="text-green-400 text-xs sm:text-sm">Best Price</p>
                    <p className="text-base sm:text-lg font-bold text-green-400">{formatPrice(item.lowestPrice)}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">@ {item.lowestMarket?.name}</p>
                  </div>
                </div>
                <Link
                  href="/prices"
                  className="w-full mt-4 py-2 text-green-400 hover:bg-green-500/10 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base transition group">
                  View Details <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
