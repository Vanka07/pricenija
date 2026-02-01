'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, onAuthStateChange } from '../../lib/supabase';

export default function useMarketData() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [markets, setMarkets] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [prices, setPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(commodities.map(c => c.category))];
    return ['All', ...cats];
  }, [commodities]);

  const getCommodityIcon = useCallback((commodity) => {
    if (commodity.icon && commodity.icon !== '⚪' && commodity.icon.trim() !== '') return commodity.icon;
    const iconMap = {
      'rice': '🍚', 'maize': '🌽', 'corn': '🌽', 'beans': '🫘',
      'yam': '🍠', 'cassava': '🥔', 'tomato': '🍅', 'onion': '🧅',
      'pepper': '🌶️', 'oil': '🫒', 'palm': '🫒', 'groundnut': '🥜',
      'millet': '🌾', 'sorghum': '🌾', 'wheat': '🌾', 'vegetable': '🥬', 'potato': '🥔',
    };
    const nameLower = commodity.name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (nameLower.includes(key)) return icon;
    }
    const categoryIcons = {
      'Grains': '🌾', 'Legumes': '🫘', 'Tubers': '🥔',
      'Vegetables': '🥬', 'Oils': '🫒', 'Processed': '📦'
    };
    return categoryIcons[commodity.category] || '🛒';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchWatchlist(session.user.id);
      else setWatchlist([]);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets').select('*').eq('is_active', true).order('name');
      if (marketsError) throw marketsError;
      setMarkets(marketsData || []);

      const { data: commoditiesData, error: commoditiesError } = await supabase
        .from('commodities').select('*').eq('is_active', true).order('category').order('name');
      if (commoditiesError) throw commoditiesError;
      setCommodities(commoditiesData || []);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices').select('*, commodity:commodities(*), market:markets(*)')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(5000);
      if (pricesError) throw pricesError;
      setPrices(pricesData || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchWatchlist = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('watchlist').select('commodity_id').eq('user_id', userId);
      if (!error && data) setWatchlist(data.map(w => w.commodity_id));
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    }
  };

  const fetchCommodityHistory = useCallback(async (commodityId, period = '30d') => {
    try {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from('prices').select('date, price, market:markets(name)')
        .eq('commodity_id', commodityId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      if (!error && data) {
        const grouped = data.reduce((acc, item) => {
          if (!acc[item.date]) acc[item.date] = { prices: [], date: item.date };
          acc[item.date].prices.push(item.price);
          return acc;
        }, {});
        const chartData = Object.values(grouped).map(g => ({
          date: new Date(g.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
          price: Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length),
        }));
        setPriceHistory(prev => ({ ...prev, [`${commodityId}-${period}`]: chartData }));
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (user) fetchWatchlist(user.id);
  }, [user]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setRefreshing(true);
        fetchData();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, loading]);

  const getPriceData = useMemo(() => {
    if (!prices.length || !commodities.length || !markets.length)
      return { commodityPrices: {}, marketPrices: {} };

    const latestPrices = {}, previousPrices = {};
    const sorted = [...prices].sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach(p => {
      const key = `${p.commodity_id}-${p.market_id}`;
      if (!latestPrices[key]) {
        latestPrices[key] = p;
      } else if (!previousPrices[key]) {
        previousPrices[key] = p;
      }
    });

    const dailyAvgs = {};
    prices.forEach(p => {
      const key = `${p.commodity_id}-${p.date}`;
      if (!dailyAvgs[key]) dailyAvgs[key] = { commodity_id: p.commodity_id, date: p.date, prices: [] };
      dailyAvgs[key].prices.push(p.price);
    });

    const commodityPrices = {};
    commodities.forEach(commodity => {
      const commodityLatest = Object.values(latestPrices).filter(p => p.commodity_id === commodity.id);
      const commodityPrevious = Object.values(previousPrices).filter(p => p.commodity_id === commodity.id);
      if (commodityLatest.length > 0) {
        const avgPrice = Math.round(commodityLatest.reduce((sum, p) => sum + p.price, 0) / commodityLatest.length);
        const avgPrevious = commodityPrevious.length > 0
          ? Math.round(commodityPrevious.reduce((sum, p) => sum + p.price, 0) / commodityPrevious.length)
          : avgPrice;
        const change = avgPrevious > 0 ? ((avgPrice - avgPrevious) / avgPrevious * 100) : 0;
        const lowestPrice = Math.min(...commodityLatest.map(p => p.price));
        const highestPrice = Math.max(...commodityLatest.map(p => p.price));

        const sparkline = Object.values(dailyAvgs)
          .filter(d => d.commodity_id === commodity.id)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(d => Math.round(d.prices.reduce((s, v) => s + v, 0) / d.prices.length));

        let bestChangeMarket = null;
        let bestChangeAbs = 0;
        commodityLatest.forEach(lp => {
          const prevEntry = commodityPrevious.find(pp => pp.market_id === lp.market_id);
          if (prevEntry && prevEntry.price > 0) {
            const mktChange = Math.abs((lp.price - prevEntry.price) / prevEntry.price * 100);
            if (mktChange > bestChangeAbs) {
              bestChangeAbs = mktChange;
              bestChangeMarket = lp.market;
            }
          }
        });

        commodityPrices[commodity.id] = {
          commodity, avgPrice, change: parseFloat(change.toFixed(1)),
          lowestPrice, highestPrice,
          lowestMarket: commodityLatest.find(p => p.price === lowestPrice)?.market,
          highestMarket: commodityLatest.find(p => p.price === highestPrice)?.market,
          bestChangeMarket,
          priceSpread: highestPrice - lowestPrice,
          marketPrices: commodityLatest,
          sparkline,
        };
      }
    });

    const marketPrices = {};
    markets.forEach(market => {
      const marketCommodityLatest = {};
      const marketCommodityPrevious = {};

      prices
        .filter(p => p.market_id === market.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(p => {
          if (!marketCommodityLatest[p.commodity_id]) {
            marketCommodityLatest[p.commodity_id] = p;
          } else if (!marketCommodityPrevious[p.commodity_id]) {
            marketCommodityPrevious[p.commodity_id] = p;
          }
        });

      const latestEntries = Object.values(marketCommodityLatest);
      if (latestEntries.length > 0) {
        const avgChange = latestEntries.reduce((sum, p) => {
          const prev = marketCommodityPrevious[p.commodity_id];
          const yPrice = prev?.price || p.price;
          return sum + (yPrice > 0 ? ((p.price - yPrice) / yPrice * 100) : 0);
        }, 0) / latestEntries.length;
        marketPrices[market.id] = { market, avgChange: parseFloat(avgChange.toFixed(1)), priceCount: latestEntries.length };
      }
    });

    return { commodityPrices, marketPrices };
  }, [prices, commodities, markets]);

  const topGainers = useMemo(() =>
    Object.values(getPriceData.commodityPrices)
      .filter(p => p.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 5), [getPriceData]);

  const topLosers = useMemo(() =>
    Object.values(getPriceData.commodityPrices)
      .filter(p => p.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 5), [getPriceData]);

  const toggleWatchlist = useCallback(async (commodityId, toast) => {
    if (!user) return { needsAuth: true };
    const commodity = commodities.find(c => c.id === commodityId);
    const name = commodity?.name || 'Item';
    try {
      if (watchlist.includes(commodityId)) {
        const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq('commodity_id', commodityId);
        if (error) {
          toast?.(`Failed to remove ${name} from watchlist`, 'error');
          return { success: false };
        }
        setWatchlist(prev => prev.filter(id => id !== commodityId));
        toast?.(`${name} removed from watchlist`, 'info');
      } else {
        const { error } = await supabase.from('watchlist').insert({ user_id: user.id, commodity_id: commodityId });
        if (error) {
          toast?.(`Failed to add ${name} to watchlist`, 'error');
          return { success: false };
        }
        setWatchlist(prev => [...prev, commodityId]);
        toast?.(`${name} added to watchlist`, 'success');
      }
      return { success: true };
    } catch (err) {
      toast?.('Something went wrong. Please try again.', 'error');
      return { success: false };
    }
  }, [user, watchlist, commodities]);

  const isInWatchlist = useCallback((commodityId) => watchlist.includes(commodityId), [watchlist]);

  const handleRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const formatPrice = (price) => price ? '₦' + price.toLocaleString('en-NG') : '₦0';

  const formatCompactPrice = (price) => {
    if (!price) return '₦0';
    if (price >= 1000000) return '₦' + (price / 1000000).toFixed(1) + 'M';
    if (price >= 1000) return '₦' + (price / 1000).toFixed(0) + 'K';
    return '₦' + price;
  };

  return {
    user, setUser, authLoading,
    markets, commodities, prices,
    priceHistory, fetchCommodityHistory,
    watchlist, toggleWatchlist, isInWatchlist,
    loading, error, lastUpdated, refreshing,
    handleRefresh, fetchData,
    categories, getCommodityIcon,
    getPriceData, topGainers, topLosers,
    formatPrice, formatCompactPrice,
  };
}
