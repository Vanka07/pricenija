'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ArrowLeft, TrendingUp, TrendingDown, Package, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function MarketDetailPage() {
    const params = useParams();
    const [market, setMarket] = useState(null);
    const [prices, setPrices] = useState([]);
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
                            .select(`
                                        *,
                                                    commodity:commodities(id, name, icon, unit, category)
                                                              `)
                            .eq('market_id', params.id)
                            .order('date', { ascending: false });

                  if (pricesError) throw pricesError;
                          setPrices(pricesData || []);

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

  // Group prices by commodity
  const groupedPrices = prices.reduce((acc, price) => {
        const commodityId = price.commodity_id;
        if (!acc[commodityId]) {
                acc[commodityId] = {
                          commodity: price.commodity,
                          prices: []
                };
        }
        acc[commodityId].prices.push(price);
        return acc;
  }, {});

  if (loading) {
        return (
                <div className="min-h-screen bg-gray-900 text-white p-8">
                  <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-800 rounded w-48 mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-32 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="bg-gray-800 rounded-xl p-6 h-40"></div>
                                         ))}
    </div>
    </div>
    </div>
    </div>
      );
}

  if (error || !market) {
        return (
                <div className="min-h-screen bg-gray-900 text-white p-8">
                  <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Market Not Found</h1>
              <p className="text-gray-400 mb-4">{error || 'The market you are looking for does not exist.'}</p>
          <Link href="/" className="text-green-500 hover:underline">
                ← Back to Dashboard
    </Link>
    </div>
    </div>
    );
}

  return (
        <div className="min-h-screen bg-gray-900 text-white">
  {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
    </Link>

          <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{market.name}</h1>
              <div className="flex items-center text-gray-400 mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{market.city}, {market.state}</span>
                <span className="mx-2">•</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-sm">{market.region}</span>
    </div>
{market.description && (
                  <p className="text-gray-400 mt-2 max-w-2xl">{market.description}</p>
               )}
</div>
  </div>
  </div>
  </header>

{/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Current Prices
        </h2>
          <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    Last updated: {prices.length > 0 ? new Date(prices[0].date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
</div>
  </div>

{Object.keys(groupedPrices).length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No price data available for this market yet.</p>
  </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{Object.values(groupedPrices).map(({ commodity, prices }) => {
                const latestPrice = prices[0];
                const previousPrice = prices[1];
                const priceChange = previousPrice 
                                                  ? ((latestPrice.price - previousPrice.price) / previousPrice.price * 100).toFixed(1)
                                  : 0;

                                                return (
                                                                  <div key={commodity?.id || latestPrice.commodity_id} 
                                                       className="bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{commodity?.icon || '📦'}</span>
                      <div>
                          <h3 className="font-semibold">{commodity?.name || 'Unknown'}</h3>
                        <p className="text-gray-400 text-sm">{commodity?.unit || 'per unit'}</p>
  </div>
  </div>
{priceChange !== 0 && (
                        <span className={`flex items-center text-sm ${
                          priceChange > 0 ? 'text-red-400' : 'text-green-400'
}`}>
{priceChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
{Math.abs(priceChange)}%
</span>
                    )}
</div>
                  <div className="mt-4">
                                          <span className="text-2xl font-bold text-green-400">
                    {formatPrice(latestPrice.price)}
                      </span>
                      </div>
                      </div>
              );
})}
</div>
        )}
</main>
  </div>
  );
}
