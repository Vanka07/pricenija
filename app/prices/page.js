'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, ArrowUpRight, ArrowDownRight, Minus,
  Star, StarOff, Loader2, AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import useMarketData from '../hooks/useMarketData';
import PageShell from '../components/PageShell';
import Sparkline from '../components/Sparkline';
import { useToast } from '../components/Toast';

const PriceChart = dynamic(() => import('../components/PriceChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-500"><Loader2 className="animate-spin" /></div>,
});

export default function PricesPage() {
  return <PricesPageContent />;
}

function PricesPageContent() {
  const {
    user, markets, commodities, prices,
    priceHistory, fetchCommodityHistory,
    watchlist, toggleWatchlist, isInWatchlist,
    loading, error, lastUpdated, refreshing,
    handleRefresh, fetchData,
    categories, getCommodityIcon,
    getPriceData, topGainers, topLosers,
    formatPrice, formatCompactPrice,
  } = useMarketData();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Set default selected commodity once data loads
  useEffect(() => {
    if (!selectedCommodity && commodities.length > 0) {
      setSelectedCommodity(commodities[0]);
    }
  }, [commodities, selectedCommodity]);

  // Fetch history when commodity or period changes
  useEffect(() => {
    if (selectedCommodity && !priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]) {
      fetchCommodityHistory(selectedCommodity.id, selectedPeriod);
    }
  }, [selectedCommodity, selectedPeriod, priceHistory, fetchCommodityHistory]);

  const filteredCommodities = useMemo(() =>
    commodities.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'All' || c.category === selectedCategory)
    ), [commodities, searchQuery, selectedCategory]);

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

  if (error && !prices.length) {
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
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 tab-content">
        {/* Commodity List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text" placeholder="Search commodities..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search commodities"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm sm:text-base transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition
                  ${selectedCategory === cat ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[280px] sm:max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
            {filteredCommodities.filter((commodity) => getPriceData.commodityPrices[commodity.id]).map((commodity) => {
              const priceData = getPriceData.commodityPrices[commodity.id];
              return (
                <button
                  key={commodity.id}
                  onClick={() => {
                    setSelectedCommodity(commodity);
                    if (!priceHistory[`${commodity.id}-${selectedPeriod}`])
                      fetchCommodityHistory(commodity.id, selectedPeriod);
                  }}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl transition text-left
                    ${selectedCommodity?.id === commodity.id
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-gray-900 border border-gray-800 hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl">{getCommodityIcon(commodity)}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{commodity.name}</p>
                      <p className="text-xs text-gray-400">{commodity.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {priceData?.sparkline?.length >= 2 && (
                      <Sparkline
                        data={priceData.sparkline}
                        color={priceData.change >= 0 ? '#22c55e' : '#ef4444'}
                        width={48}
                        height={20}
                      />
                    )}
                    <div className="text-right">
                      {priceData ? (
                        <>
                          <p className="font-semibold text-sm sm:text-base">{formatCompactPrice(priceData.avgPrice)}</p>
                          {renderChangeIndicator(priceData.change)}
                        </>
                      ) : (
                        <p className="text-gray-500 text-xs sm:text-sm">No data</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Commodity Detail */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {selectedCommodity && (
            <>
              {/* Commodity Header */}
              <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-3xl sm:text-4xl">{getCommodityIcon(selectedCommodity)}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-bold">{selectedCommodity.name}</h2>
                        <button onClick={() => handleToggleWatchlist(selectedCommodity.id)}
                          className="text-yellow-400 hover:scale-110 transition">
                          {isInWatchlist(selectedCommodity.id) ? <Star fill="currentColor" /> : <StarOff />}
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm sm:text-base">
                        {selectedCommodity.category} • {selectedCommodity.unit}
                      </p>
                    </div>
                  </div>
                </div>

                {getPriceData.commodityPrices[selectedCommodity.id] && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <div className="bg-gray-800 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">Average Price</p>
                      <p className="text-lg sm:text-xl font-bold mt-1">
                        {formatPrice(getPriceData.commodityPrices[selectedCommodity.id].avgPrice)}
                      </p>
                    </div>
                    <div className="bg-green-900/30 rounded-xl p-3 sm:p-4 border border-green-700">
                      <p className="text-green-400 text-xs sm:text-sm">Lowest Price</p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-green-400">
                        {formatPrice(getPriceData.commodityPrices[selectedCommodity.id].lowestPrice)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        @ {getPriceData.commodityPrices[selectedCommodity.id].lowestMarket?.name}
                      </p>
                    </div>
                    <div className="bg-red-900/30 rounded-xl p-3 sm:p-4 border border-red-700">
                      <p className="text-red-400 text-xs sm:text-sm">Highest Price</p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-red-400">
                        {formatPrice(getPriceData.commodityPrices[selectedCommodity.id].highestPrice)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        @ {getPriceData.commodityPrices[selectedCommodity.id].highestMarket?.name}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">Price Spread</p>
                      <p className="text-lg sm:text-xl font-bold mt-1">
                        {formatPrice(getPriceData.commodityPrices[selectedCommodity.id].priceSpread)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Potential savings</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Trend Chart */}
              <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="font-semibold">Price Trend</h3>
                  <div className="flex gap-2">
                    {['7d', '30d', '90d'].map((period) => (
                      <button key={period} onClick={() => setSelectedPeriod(period)}
                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition
                          ${selectedPeriod === period ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]?.length > 0 ? (
                  <PriceChart
                    data={priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]}
                    formatPrice={formatPrice}
                  />
                ) : (
                  <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-500">
                    {priceHistory[`${selectedCommodity.id}-${selectedPeriod}`] === undefined
                      ? <Loader2 className="animate-spin" />
                      : 'No historical data available'}
                  </div>
                )}
              </div>

              {/* Prices by Market */}
              <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800">
                <h3 className="font-semibold mb-4">Prices by Market</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs sm:text-sm border-b border-gray-800">
                        <th className="pb-3 pl-4 sm:pl-0">Market</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3 text-right">Price</th>
                        <th className="pb-3 text-right pr-4 sm:pr-0">vs Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPriceData.commodityPrices[selectedCommodity.id]?.marketPrices
                        ?.sort((a, b) => a.price - b.price)
                        .map((mp) => {
                          const avgPrice = getPriceData.commodityPrices[selectedCommodity.id].avgPrice;
                          const diff = avgPrice > 0 ? ((mp.price - avgPrice) / avgPrice * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={mp.market_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="py-3 pl-4 sm:pl-0 font-medium text-sm sm:text-base">{mp.market?.name}</td>
                              <td className="py-3 text-gray-400 text-xs sm:text-sm">{mp.market?.city}, {mp.market?.state}</td>
                              <td className="py-3 text-right font-semibold text-sm sm:text-base">{formatPrice(mp.price)}</td>
                              <td className="py-3 text-right pr-4 sm:pr-0">
                                <span className={`text-xs sm:text-sm ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                  {diff > 0 ? '+' : ''}{diff}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
