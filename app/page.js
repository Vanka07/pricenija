'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, TrendingUp, TrendingDown, MapPin, Bell,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus,
  RefreshCw, Menu, X, Star, StarOff, Home, BarChart3,
  User, LogIn, LogOut, Loader2, AlertCircle,
  Twitter, Facebook, Instagram, Mail, Shield, FileText
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase, onAuthStateChange } from '../lib/supabase';
import { PageLoadingSkeleton } from './components/LoadingSkeleton';
import Logo from './components/Logo';
import AuthModal from './components/AuthModal';
import NotificationDropdown from './components/NotificationDropdown';
import BottomNav from './components/BottomNav';
import { ToastProvider, useToast } from './components/Toast';

import Sparkline from './components/Sparkline';

// Lazy-load entire PriceChart component (~50KB recharts bundle deferred)
const PriceChart = dynamic(() => import('./components/PriceChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-500"><Loader2 className="animate-spin" /></div>,
});

export default function PriceNija() {
  return (
    <ToastProvider>
      <PriceNijaApp />
    </ToastProvider>
  );
}

function PriceNijaApp() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [markets, setMarkets] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [prices, setPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTabState] = useState('dashboard');

  // Helper function to change tab and update URL hash for browser history
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab }, '', `#${tab}`);
      const titles = {
        dashboard: 'PriceNija - Nigerian Commodity Market Price Tracker',
        prices: 'Prices - PriceNija',
        markets: 'Markets - PriceNija',
        watchlist: 'Watchlist - PriceNija',
      };
      document.title = titles[tab] || titles.dashboard;
    }
  }, []);

  // Read URL hash on initial load to restore tab state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'prices', 'markets', 'watchlist'];
      if (hash && validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    }
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event) => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'prices', 'markets', 'watchlist'];
      if (hash && validTabs.includes(hash)) {
        setActiveTabState(hash);
      } else {
        setActiveTabState('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showNotifications, setShowNotifications] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(commodities.map(c => c.category))];
    return ['All', ...cats];
  }, [commodities]);

  const getCommodityIcon = (commodity) => {
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
  };

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

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices').select('*, commodity:commodities(*), market:markets(*)')
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
      if (pricesError) throw pricesError;
      setPrices(pricesData || []);
      setLastUpdated(new Date());
      if (!selectedCommodity && commoditiesData?.length > 0) setSelectedCommodity(commoditiesData[0]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCommodity]);

  const fetchWatchlist = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('watchlist').select('commodity_id').eq('user_id', userId);
      if (!error && data) setWatchlist(data.map(w => w.commodity_id));
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    }
  };

  const fetchCommodityHistory = async (commodityId, period = '30d') => {
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
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedCommodity && !priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]) {
      fetchCommodityHistory(selectedCommodity.id, selectedPeriod);
    }
  }, [selectedCommodity, selectedPeriod, priceHistory]);

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

    // Get unique dates from database and sort them (most recent first)
    const sortedDates = [...new Set(prices.map(p => p.date))].sort().reverse();
    const latestDate = sortedDates[0]; // Most recent date in database
    const previousDate = sortedDates[1] || sortedDates[0]; // Second most recent (or same if only one date)

    const latestPrices = {}, previousPrices = {};

    prices.forEach(p => {
      const key = `${p.commodity_id}-${p.market_id}`;
      if (p.date === latestDate) {
        latestPrices[key] = p;
      }
      if (p.date === previousDate) {
        previousPrices[key] = p;
      }
    });

    // Build daily averages per commodity for sparkline
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

        // Sparkline data: daily average prices sorted by date
        const sparkline = Object.values(dailyAvgs)
          .filter(d => d.commodity_id === commodity.id)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(d => Math.round(d.prices.reduce((s, v) => s + v, 0) / d.prices.length));

        commodityPrices[commodity.id] = {
          commodity, avgPrice, change: parseFloat(change.toFixed(1)),
          lowestPrice, highestPrice,
          lowestMarket: commodityLatest.find(p => p.price === lowestPrice)?.market,
          highestMarket: commodityLatest.find(p => p.price === highestPrice)?.market,
          priceSpread: highestPrice - lowestPrice,
          marketPrices: commodityLatest,
          sparkline,
        };
      }
    });

    const marketPrices = {};
    markets.forEach(market => {
      const marketLatest = Object.values(latestPrices).filter(p => p.market_id === market.id);
      if (marketLatest.length > 0) {
        const avgChange = marketLatest.reduce((sum, p) => {
          const yPrice = previousPrices[`${p.commodity_id}-${market.id}`]?.price || p.price;
          return sum + (yPrice > 0 ? ((p.price - yPrice) / yPrice * 100) : 0);
        }, 0) / marketLatest.length;
        marketPrices[market.id] = { market, avgChange: parseFloat(avgChange.toFixed(1)), priceCount: marketLatest.length };
      }
    });

    return { commodityPrices, marketPrices };
  }, [prices, commodities, markets]);

  const getBestMarket = useMemo(() => {
    const arr = Object.values(getPriceData.marketPrices);
    if (arr.length === 0) return null;
    return arr.sort((a, b) => a.avgChange - b.avgChange)[0]?.market || null;
  }, [getPriceData.marketPrices]);

  const getMostVolatile = useMemo(() => {
    return Object.values(getPriceData.commodityPrices)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0] || null;
  }, [getPriceData.commodityPrices]);

  const toggleWatchlist = async (commodityId) => {
    if (!user) { setShowAuthModal(true); return; }
    const commodity = commodities.find(c => c.id === commodityId);
    const name = commodity?.name || 'Item';
    try {
      if (watchlist.includes(commodityId)) {
        const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq('commodity_id', commodityId);
        if (error) {
          console.error('Error removing from watchlist:', error);
          toast(`Failed to remove ${name} from watchlist`, 'error');
          return;
        }
        setWatchlist(prev => prev.filter(id => id !== commodityId));
        toast(`${name} removed from watchlist`, 'info');
      } else {
        const { error } = await supabase.from('watchlist').insert({ user_id: user.id, commodity_id: commodityId });
        if (error) {
          console.error('Error adding to watchlist:', error);
          toast(`Failed to add ${name} to watchlist`, 'error');
          return;
        }
        setWatchlist(prev => [...prev, commodityId]);
        toast(`${name} added to watchlist`, 'success');
      }
    } catch (err) {
      console.error('Error updating watchlist:', err);
      toast('Something went wrong. Please try again.', 'error');
    }
  };

  const isInWatchlist = (commodityId) => watchlist.includes(commodityId);

  const filteredCommodities = useMemo(() =>
    commodities.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'All' || c.category === selectedCategory)
    ), [commodities, searchQuery, selectedCategory]);

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

  const watchlistItems = useMemo(() =>
    watchlist.map(id => getPriceData.commodityPrices[id]).filter(Boolean), [watchlist, getPriceData]);

  const formatPrice = (price) => price ? '₦' + price.toLocaleString('en-NG') : '₦0';

  const formatCompactPrice = (price) => {
    if (!price) return '₦0';
    if (price >= 1000000) return '₦' + (price / 1000000).toFixed(1) + 'M';
    if (price >= 1000) return '₦' + (price / 1000).toFixed(0) + 'K';
    return '₦' + price;
  };

  const handleRefresh = () => { setRefreshing(true); fetchData(); };
  const handlePeriodChange = (period) => setSelectedPeriod(period);

  const renderChangeIndicator = (change) => {
    if (change > 0) return <span className="text-green-400 flex items-center gap-1"><ArrowUpRight size={14} />+{change.toFixed(1)}%</span>;
    if (change < 0) return <span className="text-red-400 flex items-center gap-1"><ArrowDownRight size={14} />{change.toFixed(1)}%</span>;
    return <span className="text-gray-400 flex items-center gap-1"><Minus size={14} />0%</span>;
  };

  // Helper function to calculate average grain price
  const getAvgGrainPrice = () => {
    const grains = Object.values(getPriceData.commodityPrices).filter(p => p.commodity.category === 'Grains');
    if (grains.length === 0) return 0;
    return Math.round(grains.reduce((sum, p) => sum + p.avgPrice, 0) / grains.length);
  };

  // Loading state
  if (loading) return <PageLoadingSkeleton />;

  // Error state
  if (error && !prices.length) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={() => { setLoading(true); fetchData(); }}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg">
          Try Again
        </button>
      </div>
    </div>
  );

  const hasData = Object.keys(getPriceData.commodityPrices).length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Custom animation styles */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        .hover\\:bg-gray-750:hover {
          background-color: rgb(38, 42, 51);
        }
        .tab-content {
          animation: tab-fade-in 0.3s ease-out;
        }
        @keyframes tab-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Skip to content link for keyboard/screen reader users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-green-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to main content
      </a>
      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        authMode={authMode}
        setAuthMode={setAuthMode}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800" role="banner">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo - Clickable to go home */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="hidden sm:block"><Logo size="md" /></div>
              <div className="sm:hidden"><Logo size="sm" /></div>
              <div>
                <span className="text-lg sm:text-xl font-bold">Price<span className="text-green-400">Nija</span></span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">Track • Compare • Save</span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {['dashboard', 'prices', 'markets', 'watchlist'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 lg:px-4 py-2 rounded-lg font-medium transition capitalize flex items-center gap-2
                    ${activeTab === tab ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  {tab === 'dashboard' && <Home size={18} />}
                  {tab === 'prices' && <BarChart3 size={18} />}
                  {tab === 'markets' && <MapPin size={18} />}
                  {tab === 'watchlist' && <Star size={18} />}
                  {tab}
                </button>
              ))}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative">
                <button className="relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications">
                  <Bell size={20} />
                  {(topGainers.length > 0 || topLosers.length > 0) && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                      {topGainers.length + topLosers.length}
                    </span>
                  )}
                </button>
                <NotificationDropdown show={showNotifications} topGainers={topGainers} topLosers={topLosers} />
              </div>

              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline text-sm text-gray-400">{user.email?.split('@')[0]}</span>
                  <button onClick={async () => { await supabase.auth.signOut(); setUser(null); setWatchlist([]); }}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white" title="Sign out" aria-label="Sign out">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1 sm:gap-2 bg-green-500 hover:bg-green-600 px-2 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base">
                  <LogIn size={18} /><span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-2 px-3 sm:px-4">
            {['dashboard', 'prices', 'markets', 'watchlist'].map((tab) => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium capitalize flex items-center gap-3
                  ${activeTab === tab ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}>
                {tab === 'dashboard' && <Home size={18} />}
                {tab === 'prices' && <BarChart3 size={18} />}
                {tab === 'markets' && <MapPin size={18} />}
                {tab === 'watchlist' && <Star size={18} />}
                {tab}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Click outside to close notifications */}
      {showNotifications && <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />}

      {/* Status Bar */}
<div className="bg-gray-900 border-b border-gray-800 py-2">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400">Live</span>
            </span>
            <span className="text-gray-500">
              Last updated: {lastUpdated?.toLocaleString('en-NG', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) || 'Loading...'}
            </span>
          </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1 text-green-400 hover:text-green-300 disabled:opacity-50"
              aria-label="Refresh data">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6" role="main">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6 tab-content">
            {/* Hero Section for first-time visitors */}
            {!user && (
              <div className="relative overflow-hidden bg-gradient-to-br from-green-900/40 via-gray-900 to-blue-900/40 rounded-2xl p-6 sm:p-8 border border-green-800/30 mb-2">
                {/* Subtle grid background */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                {/* Glowing orbs */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-4">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs font-medium">Live market data</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold mb-3 leading-tight">
                      Compare Prices.<br />
                      <span className="text-green-400">Save Money.</span>
                    </h1>
                    <p className="text-gray-300 text-sm sm:text-base mb-5 max-w-lg">
                      Find the cheapest market for any commodity across Nigeria. Real-time prices from {markets.length}+ markets — updated daily.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <User size={18} /> Get Started Free
                      </button>
                      <button
                        onClick={() => setActiveTab('prices')}
                        className="bg-white/10 hover:bg-white/15 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-white/10"
                      >
                        Explore Prices
                      </button>
                    </div>
                  </div>
                  {/* Quick Stats */}
                  <div className="flex gap-6 md:gap-4 md:flex-col">
                    {[
                      { value: commodities.length + '+', label: 'Commodities', color: 'text-green-400', delay: '0.1s' },
                      { value: markets.length + '+', label: 'Markets', color: 'text-blue-400', delay: '0.2s' },
                      { value: 'Daily', label: 'Updates', color: 'text-yellow-400', delay: '0.3s' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center md:text-right animate-fade-in-up" style={{ animationDelay: stat.delay }}>
                        <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Quick search commodities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setActiveTab('prices')}
                aria-label="Search commodities"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm sm:text-base transition"
              />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Market Overview</h2>
              <p className="text-gray-400 text-sm sm:text-base">Real-time prices across Nigeria&apos;s top markets</p>
            </div>

            {!hasData ? (
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-center border border-gray-800">
                <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No Price Data Yet</h3>
                <p className="text-gray-400 mb-4 text-sm sm:text-base">
                  Prices haven&apos;t been entered for today. Check back later or contact the admin.
                </p>
              </div>
            ) : (
              <>
                {/* Dashboard Cards - NOW CLICKABLE */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Avg. Grain Price Card */}
                  <button
                    onClick={() => { setActiveTab('prices'); setSelectedCategory('Grains'); }}
                    className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-3 sm:p-4 text-left hover:from-green-500 hover:to-green-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-green-200 text-xs sm:text-sm">Avg. Grain Price</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 truncate">
                          {formatCompactPrice(getAvgGrainPrice())}
                        </p>
                        <p className="text-green-200 text-xs mt-1">per 100kg bag</p>
                      </div>
                      <TrendingUp className="text-green-200 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ml-2" />
                    </div>
                  </button>

                  {/* Best Market Card */}
                  <button
                    onClick={() => setActiveTab('markets')}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-3 sm:p-4 text-left hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-blue-200 text-xs sm:text-sm">Lowest Prices</p>
                        <p className="text-base sm:text-xl font-bold mt-1 line-clamp-2 leading-tight">
                          {getBestMarket?.name || 'N/A'}
                        </p>
                        <p className="text-blue-200 text-xs mt-1 truncate">
                          {getBestMarket ? `${getBestMarket.city}, ${getBestMarket.state}` : ''}
                        </p>
                      </div>
                      <MapPin className="text-blue-200 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ml-2" />
                    </div>
                  </button>

                  {/* Most Volatile Card */}
                  <button
                    onClick={() => {
                      if (getMostVolatile) {
                        setSelectedCommodity(getMostVolatile.commodity);
                        setActiveTab('prices');
                        if (!priceHistory[`${getMostVolatile.commodity.id}-${selectedPeriod}`]) {
                          fetchCommodityHistory(getMostVolatile.commodity.id, selectedPeriod);
                        }
                      }
                    }}
                    className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-3 sm:p-4 text-left hover:from-orange-500 hover:to-orange-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-orange-200 text-xs sm:text-sm">Most Volatile</p>
                        <p className="text-base sm:text-xl font-bold mt-1 truncate">
                          {getMostVolatile?.commodity?.name || 'N/A'}
                        </p>
                        <p className="text-orange-200 text-xs mt-1">
                          {Math.abs(getMostVolatile?.change || 0).toFixed(1)}% change
                        </p>
                      </div>
                      <TrendingUp className="text-orange-200 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ml-2" />
                    </div>
                  </button>

                  {/* Watchlist Items Card */}
                  <button
                    onClick={() => setActiveTab('watchlist')}
                    className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-3 sm:p-4 text-left hover:from-purple-500 hover:to-purple-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-purple-200 text-xs sm:text-sm">Watchlist Items</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{watchlist.length}</p>
                        <p className="text-purple-200 text-xs mt-1">commodities tracked</p>
                      </div>
                      <Star className="text-purple-200 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ml-2" />
                    </div>
                  </button>
                </div>

                {/* Price Changes & Watchlist Section */}
                <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Price Increases */}
                  <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-800">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <TrendingUp className="text-green-400" size={20} />Price Increases
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {topGainers.length > 0 ? topGainers.map((item, index) => (
                        <button
                          key={item.commodity.id}
                          onClick={() => { setSelectedCommodity(item.commodity); setActiveTab('prices'); }}
                          className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-800 rounded-xl hover:bg-gray-750 hover:shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 border border-transparent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200">{getCommodityIcon(item.commodity)}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate group-hover:text-green-300 transition-colors">{item.commodity.name}</p>
                              <p className="text-xs text-gray-400 truncate">{item.lowestMarket?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {item.sparkline?.length >= 2 && <Sparkline data={item.sparkline} color="#22c55e" width={40} height={18} />}
                            <span className="text-green-400 font-semibold text-sm sm:text-base group-hover:text-green-300 transition-colors">
                              +{item.change.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      )) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Minus className="text-gray-500" size={24} />
                          </div>
                          <p className="text-gray-400 text-sm font-medium">Prices Stable</p>
                          <p className="text-gray-500 text-xs mt-1">No price increases recorded today</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Drops */}
                  <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-800">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <TrendingDown className="text-red-400" size={20} />Price Drops
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {topLosers.length > 0 ? topLosers.map((item, index) => (
                        <button
                          key={item.commodity.id}
                          onClick={() => { setSelectedCommodity(item.commodity); setActiveTab('prices'); }}
                          className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-800 rounded-xl hover:bg-gray-750 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-500/30 border border-transparent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200">{getCommodityIcon(item.commodity)}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate group-hover:text-red-300 transition-colors">{item.commodity.name}</p>
                              <p className="text-xs text-gray-400 truncate">{item.lowestMarket?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {item.sparkline?.length >= 2 && <Sparkline data={item.sparkline} color="#ef4444" width={40} height={18} />}
                            <span className="text-red-400 font-semibold text-sm sm:text-base group-hover:text-red-300 transition-colors">
                              {item.change.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      )) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingDown className="text-gray-500" size={24} />
                          </div>
                          <p className="text-gray-400 text-sm font-medium">Prices Holding</p>
                          <p className="text-gray-500 text-xs mt-1">No significant price drops</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Your Watchlist */}
                  <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <Star className="text-yellow-400" size={20} />Your Watchlist
                      </h3>
                      <button onClick={() => setActiveTab('watchlist')}
                        className="text-green-400 text-xs sm:text-sm hover:text-green-300 flex items-center gap-1 group transition-colors">
                        View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {watchlistItems.length > 0 ? watchlistItems.slice(0, 4).map((item) => (
                        <button
                          key={item.commodity.id}
                          onClick={() => { setSelectedCommodity(item.commodity); setActiveTab('prices'); }}
                          className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition text-left"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-xl sm:text-2xl">{getCommodityIcon(item.commodity)}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{item.commodity.name}</p>
                              <p className="text-xs text-gray-400 truncate">Avg: {formatCompactPrice(item.avgPrice)}</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">{renderChangeIndicator(item.change)}</div>
                        </button>
                      )) : (
                        <div className="text-center py-6">
                          {/* Animated star illustration */}
                          <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full animate-pulse"></div>
                            <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
                              <Star className="text-yellow-500/70" size={24} />
                            </div>
                            {/* Floating mini stars */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-bounce" style={{ animationDelay: '0.1s' }}>✦</div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 text-yellow-500 animate-bounce" style={{ animationDelay: '0.3s' }}>✦</div>
                          </div>
                          <p className="text-gray-300 text-sm font-medium mb-1">
                            {user ? 'Your watchlist is empty' : 'Track Your Favorites'}
                          </p>
                          <p className="text-gray-500 text-xs mb-4 max-w-[180px] mx-auto">
                            {user ? 'Click the star icon on any commodity to add it here' : 'Get price alerts & updates'}
                          </p>
                          {!user ? (
                            <button onClick={() => setShowAuthModal(true)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white text-xs px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 active:scale-95">
                              Create free account
                            </button>
                          ) : (
                            <button onClick={() => setActiveTab('prices')}
                              className="text-green-400 hover:text-green-300 text-xs font-medium flex items-center gap-1 mx-auto group">
                              Browse commodities <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Prices Tab */}
        {activeTab === 'prices' && (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 tab-content">
            {/* Commodity List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text" placeholder="Search commodities..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search commodities"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-green-500 text-sm sm:text-base"
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

              <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                {filteredCommodities.map((commodity) => {
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
                            <button onClick={() => toggleWatchlist(selectedCommodity.id)}
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
                          <button key={period} onClick={() => handlePeriodChange(period)}
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
        )}

        {/* Markets Tab */}
        {activeTab === 'markets' && (
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
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
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
                  <button onClick={() => setActiveTab('prices')}
                    className="text-gray-400 hover:text-white px-6 py-2.5 rounded-xl font-medium transition border border-gray-700 hover:border-gray-600">
                    Browse Prices First
                  </button>
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
                <p className="text-gray-500 text-xs mb-6">You'll see price changes and trends here at a glance.</p>
                <button onClick={() => setActiveTab('prices')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]">
                  Browse Commodities
                </button>
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
                      <button onClick={() => toggleWatchlist(item.commodity.id)}
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
                    <button
                      onClick={() => { setSelectedCommodity(item.commodity); setActiveTab('prices'); }}
                      className="w-full mt-4 py-2 text-green-400 hover:bg-green-500/10 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base transition group">
                      View Details <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-8 sm:mt-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Logo size="sm" />
                <span className="font-bold text-lg">Price<span className="text-green-400">Nija</span></span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Nigeria&apos;s leading agricultural commodity price tracker. Real-time market intelligence for smarter decisions.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                <a href="https://twitter.com/pricenija" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
                <a href="https://facebook.com/pricenija" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
                <a href="https://instagram.com/pricenija" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setActiveTab('dashboard')} className="text-gray-400 hover:text-green-400 transition">Dashboard</button></li>
                <li><button onClick={() => setActiveTab('prices')} className="text-gray-400 hover:text-green-400 transition">Prices</button></li>
                <li><button onClick={() => setActiveTab('markets')} className="text-gray-400 hover:text-green-400 transition">Markets</button></li>
                <li><button onClick={() => setActiveTab('watchlist')} className="text-gray-400 hover:text-green-400 transition">Watchlist</button></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-green-400 transition">About Us</Link></li>
                <li><Link href="/about#faq" className="text-gray-400 hover:text-green-400 transition">FAQ</Link></li>
                <li><Link href="/about#how-it-works" className="text-gray-400 hover:text-green-400 transition">How It Works</Link></li>
                <li><Link href="/about#contact" className="text-gray-400 hover:text-green-400 transition">Contact</Link></li>
              </ul>
            </div>

            {/* Contact & Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:support@pricenija.com" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2">
                    <Mail size={14} /> support@pricenija.com
                  </a>
                </li>
              </ul>
              <h4 className="font-semibold text-white mb-3 mt-6">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-500 flex items-center gap-2"><Shield size={14} /> Privacy Policy</span></li>
                <li><span className="text-gray-500 flex items-center gap-2"><FileText size={14} /> Terms of Service</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs sm:text-sm">
              © {new Date().getFullYear()} PriceNija. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Made with 💚 for Nigerian farmers and traders
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
