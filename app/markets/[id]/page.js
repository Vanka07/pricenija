'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ArrowLeft, TrendingUp, TrendingDown, Package, Clock, BarChart3, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function MarketDetailPage() {
  const params = useParams();
  const [market, setMarket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [allMarketPrices, setAllMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        setLoading(true);

        // Fetch market details
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('*')
          .eq('id', params.id)
          .single();

        if (marketError) throw marketError;
        setMarket(marketData);

        // Fetch prices for this market
        const { data: pricesData, error: pricesError } = await supabase
          .from('prices')
          .select('*, commodity:commodities(id, name, icon, unit, category)')
          .eq('market_id', params.id)
          .order('date', { ascending: false });

        if (pricesError) throw pricesError;
        setPrices(pricesData || []);

        // Fetch ALL latest prices across ALL markets for comparison
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: allPrices, error: allPricesError } = await supabase
          .from('prices')
          .select('*, market:markets(id, name, city, state)')
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (!allPricesError && allPrices) {
          setAllMarketPrices(allPrices);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchMarketData();
    }
  }, [params.id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Group prices by commodity for this market
  const groupedPrices = prices.reduce((acc, price) => {
    const commodityId = price.commodity_id;
    if (!acc[commodityId]) {
      acc[commodityId] = {
        commodity: price.commodity,
        prices: [],
      };
    }
    acc[commodityId].prices.push(price);
    return acc;
  }, {});

  // Compute cross-market averages for comparison
  const crossMarketData = useMemo(() => {
    if (!allMarketPrices.length) return {};

    // Find the latest date across all markets
    const sortedDates = [...new Set(allMarketPrices.map(p => p.date))].sort().reverse();
    const latestDate = sortedDates[0];

    // Get latest prices per commodity per market
    const latestByKey = {};
    allMarketPrices.forEach(p => {
      if (p.date === latestDate) {
        latestByKey[`${p.commodity_id}-${p.market_id}`] = p;
      }
    });

    // Group by commodity
    const byCommodity = {};
    Object.values(latestByKey).forEach(p => {
      if (!byCommodity[p.commodity_id]) byCommodity[p.commodity_id] = [];
      byCommodity[p.commodity_id].push(p);
    });

    // Compute stats per commodity
    const result = {};
    Object.entries(byCommodity).forEach(([commodityId, entries]) => {
      const allPricesForCommodity = entries.map(e => e.price);
      const avg = Math.round(allPricesForCommodity.reduce((s, v) => s + v, 0) / allPricesForCommodity.length);
      const lowest = Math.min(...allPricesForCommodity);
      const highest = Math.max(...allPricesForCommodity);
      const lowestMarket = entries.find(e => e.price === lowest)?.market;
      const highestMarket = entries.find(e => e.price === highest)?.market;

      // Find this market's price
      const thisMarketEntry = entries.find(e => String(e.market_id) === String(params.id));
      const thisPrice = thisMarketEntry?.price || null;
      const diff = thisPrice && avg > 0 ? ((thisPrice - avg) / avg * 100) : null;
      const rank = thisPrice
        ? allPricesForCommodity.sort((a, b) => a - b).indexOf(thisPrice) + 1
        : null;

      result[commodityId] = {
        avg,
        lowest,
        highest,
        lowestMarket,
        highestMarket,
        thisPrice,
        diff: diff !== null ? parseFloat(diff.toFixed(1)) : null,
        rank,
        totalMarkets: entries.length,
      };
    });

    return result;
  }, [allMarketPrices, params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-32 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Market Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'The market you are looking for does not exist.'}</p>
          <Link href="/" className="text-green-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-3 text-sm transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{market.name}</h1>
              <div className="flex items-center text-gray-400 mt-1.5 text-sm">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>{market.city}, {market.state}</span>
                <span className="mx-2">&bull;</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded text-xs">{market.region}</span>
              </div>
              {market.description && (
                <p className="text-gray-500 mt-2 max-w-2xl text-sm">{market.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Commodity Prices
          </h2>
          <div className="flex items-center text-gray-400 text-xs sm:text-sm gap-1">
            <Clock className="w-4 h-4" />
            {prices.length > 0
              ? new Date(prices[0].date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'N/A'}
          </div>
        </div>

        {Object.keys(groupedPrices).length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No price data available for this market yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(groupedPrices).map(({ commodity, prices: commodityPrices }) => {
              const latestPrice = commodityPrices[0];
              const previousPrice = commodityPrices[1];
              const priceChange = previousPrice
                ? ((latestPrice.price - previousPrice.price) / previousPrice.price * 100).toFixed(1)
                : 0;
              const comparison = crossMarketData[latestPrice.commodity_id];

              return (
                <div
                  key={commodity?.id || latestPrice.commodity_id}
                  className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all duration-200"
                >
                  {/* Commodity Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{commodity?.icon || '📦'}</span>
                      <div>
                        <h3 className="font-semibold">{commodity?.name || 'Unknown'}</h3>
                        <p className="text-gray-500 text-xs">{commodity?.unit || 'per unit'}</p>
                      </div>
                    </div>
                    {priceChange != 0 && (
                      <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-lg ${
                        priceChange > 0 ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'
                      }`}>
                        {priceChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {Math.abs(priceChange)}%
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-2xl font-bold text-white mb-3">
                    {formatPrice(latestPrice.price)}
                  </p>

                  {/* Cross-market comparison */}
                  {comparison && comparison.totalMarkets > 1 && (
                    <div className="border-t border-gray-800 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                          <BarChart3 size={12} /> vs {comparison.totalMarkets} markets
                        </span>
                        {comparison.diff !== null && (
                          <span className={`font-medium ${
                            comparison.diff < -1 ? 'text-green-400' : comparison.diff > 1 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {comparison.diff > 0 ? '+' : ''}{comparison.diff}% vs avg
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 mb-0.5">Lowest</p>
                          <p className="text-xs font-semibold text-green-400">{formatPrice(comparison.lowest)}</p>
                          <p className="text-[10px] text-gray-600 truncate">{comparison.lowestMarket?.name}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 mb-0.5">Average</p>
                          <p className="text-xs font-semibold text-white">{formatPrice(comparison.avg)}</p>
                          <p className="text-[10px] text-gray-600">All markets</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 mb-0.5">Highest</p>
                          <p className="text-xs font-semibold text-red-400">{formatPrice(comparison.highest)}</p>
                          <p className="text-[10px] text-gray-600 truncate">{comparison.highestMarket?.name}</p>
                        </div>
                      </div>

                      {comparison.rank && (
                        <p className="text-[10px] text-gray-500 text-center">
                          Ranked #{comparison.rank} cheapest of {comparison.totalMarkets} markets
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
