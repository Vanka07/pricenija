'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, TrendingUp, TrendingDown, MapPin, Bell, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus, 
  RefreshCw, Menu, X, Star, StarOff, Home, BarChart3,
  User, LogIn, LogOut, Loader2, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';
import { supabase, onAuthStateChange } from '../lib/supabase';

export default function PriceNija() {
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
  const [activeTab, setActiveTab] = useState('dashboard');
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
      'rice': '🍚', 'maize': '🌽', 'corn': '🌽', 'beans': '🫘', 'yam': '🍠',
      'cassava': '🥔', 'tomato': '🍅', 'onion': '🧅', 'pepper': '🌶️',
      'oil': '🫒', 'palm': '🫒', 'groundnut': '🥜', 'millet': '🌾',
      'sorghum': '🌾', 'wheat': '🌾', 'vegetable': '🥬', 'potato': '🥔',
    };
    const nameLower = commodity.name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (nameLower.includes(key)) return icon;
    }
    const categoryIcons = { 'Grains': '🌾', 'Legumes': '🫘', 'Tubers': '🥔', 'Vegetables': '🥬', 'Oils': '🫒', 'Processed': '📦' };
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
      const { data: marketsData, error: marketsError } = await supabase.from('markets').select('*').eq('is_active', true).order('name');
      if (marketsError) throw marketsError;
      setMarkets(marketsData || []);
      const { data: commoditiesData, error: commoditiesError } = await supabase.from('commodities').select('*').eq('is_active', true).order('category').order('name');
      if (commoditiesError) throw commoditiesError;
      setCommodities(commoditiesData || []);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: pricesData, error: pricesError } = await supabase.from('prices').select('*, commodity:commodities(*), market:markets(*)').gte('date', sevenDaysAgo.toISOString().split('T')[0]).order('date', { ascending: false });
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
      const { data, error } = await supabase.from('watchlist').select('commodity_id').eq('user_id', userId);
      if (!error && data) setWatchlist(data.map(w => w.commodity_id));
    } catch (err) { console.error('Error fetching watchlist:', err); }
  };

  const fetchCommodityHistory = async (commodityId, period = '30d') => {
    try {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase.from('prices').select('date, price, market:markets(name)').eq('commodity_id', commodityId).gte('date', startDate.toISOString().split('T')[0]).order('date', { ascending: true });
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
    } catch (err) { console.error('Error fetching price history:', err); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (selectedCommodity && !priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]) {
      fetchCommodityHistory(selectedCommodity.id, selectedPeriod);
    }
  }, [selectedCommodity, selectedPeriod, priceHistory]);
  useEffect(() => {
    const interval = setInterval(() => { if (!loading) { setRefreshing(true); fetchData(); } }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, loading]);

  const getPriceData = useMemo(() => {
    if (!prices.length || !commodities.length || !markets.length) return { commodityPrices: {}, marketPrices: {} };
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const latestPrices = {}, yesterdayPrices = {};
    prices.forEach(p => {
      const key = `${p.commodity_id}-${p.market_id}`;
      if (p.date === today || !latestPrices[key] || p.date > latestPrices[key].date) { if (p.date <= today) latestPrices[key] = p; }
      if (p.date === yesterday) yesterdayPrices[key] = p;
    });
    const commodityPrices = {};
    commodities.forEach(commodity => {
      const commodityLatest = Object.values(latestPrices).filter(p => p.commodity_id === commodity.id);
      const commodityYesterday = Object.values(yesterdayPrices).filter(p => p.commodity_id === commodity.id);
      if (commodityLatest.length > 0) {
        const avgPrice = Math.round(commodityLatest.reduce((sum, p) => sum + p.price, 0) / commodityLatest.length);
        const avgYesterday = commodityYesterday.length > 0 ? Math.round(commodityYesterday.reduce((sum, p) => sum + p.price, 0) / commodityYesterday.length) : avgPrice;
        const change = avgYesterday > 0 ? ((avgPrice - avgYesterday) / avgYesterday * 100) : 0;
        const lowestPrice = Math.min(...commodityLatest.map(p => p.price));
        const highestPrice = Math.max(...commodityLatest.map(p => p.price));
        commodityPrices[commodity.id] = {
          commodity, avgPrice, change: parseFloat(change.toFixed(1)), lowestPrice, highestPrice,
          lowestMarket: commodityLatest.find(p => p.price === lowestPrice)?.market,
          highestMarket: commodityLatest.find(p => p.price === highestPrice)?.market,
          priceSpread: highestPrice - lowestPrice, marketPrices: commodityLatest,
        };
      }
    });
    const marketPrices = {};
    markets.forEach(market => {
      const marketLatest = Object.values(latestPrices).filter(p => p.market_id === market.id);
      if (marketLatest.length > 0) {
        const avgChange = marketLatest.reduce((sum, p) => {
          const yPrice = yesterdayPrices[`${p.commodity_id}-${market.id}`]?.price || p.price;
          return sum + ((p.price - yPrice) / yPrice * 100);
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

  const toggleWatchlist = async (commodityId) => {
    if (!user) { setShowAuthModal(true); return; }
    try {
      if (watchlist.includes(commodityId)) {
        await supabase.from('watchlist').delete().eq('user_id', user.id).eq('commodity_id', commodityId);
        setWatchlist(prev => prev.filter(id => id !== commodityId));
      } else {
        await supabase.from('watchlist').insert({ user_id: user.id, commodity_id: commodityId });
        setWatchlist(prev => [...prev, commodityId]);
      }
    } catch (err) { console.error('Error updating watchlist:', err); }
  };

  const isInWatchlist = (commodityId) => watchlist.includes(commodityId);
  const filteredCommodities = useMemo(() => commodities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCategory === 'All' || c.category === selectedCategory)), [commodities, searchQuery, selectedCategory]);
  const topGainers = useMemo(() => Object.values(getPriceData.commodityPrices).filter(p => p.change > 0).sort((a, b) => b.change - a.change).slice(0, 5), [getPriceData]);
  const topLosers = useMemo(() => Object.values(getPriceData.commodityPrices).filter(p => p.change < 0).sort((a, b) => a.change - b.change).slice(0, 5), [getPriceData]);
  const watchlistItems = useMemo(() => watchlist.map(id => getPriceData.commodityPrices[id]).filter(Boolean), [watchlist, getPriceData]);

  const formatPrice = (price) => price ? '₦' + price.toLocaleString('en-NG') : '₦0';
  const formatCompactPrice = (price) => { if (!price) return '₦0'; if (price >= 1000000) return '₦' + (price / 1000000).toFixed(1) + 'M'; if (price >= 1000) return '₦' + (price / 1000).toFixed(0) + 'K'; return '₦' + price; };
  const handleRefresh = () => { setRefreshing(true); fetchData(); };
  const handlePeriodChange = (period) => setSelectedPeriod(period);

  const renderChangeIndicator = (change) => {
    if (change > 0) return <span className="text-green-400 flex items-center gap-1"><ArrowUpRight size={14} />+{change.toFixed(1)}%</span>;
    if (change < 0) return <span className="text-red-400 flex items-center gap-1"><ArrowDownRight size={14} />{change.toFixed(1)}%</span>;
    return <span className="text-gray-400 flex items-center gap-1"><Minus size={14} />0%</span>;
  };

  const AuthModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const handleSubmit = async (e) => {
      e.preventDefault(); setAuthError(''); setSuccessMessage(''); setAuthLoading(true);
      try {
        if (authMode === 'register') {
          const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
          if (error) throw error;
          setSuccessMessage('Account created! Please check your email to verify.');
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setShowAuthModal(false);
        }
      } catch (err) { setAuthError(err.message); } finally { setAuthLoading(false); }
    };
    if (!showAuthModal) return null;
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
          </div>
          {authError && <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-400 text-sm">{authError}</div>}
          {successMessage && <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4 text-green-400 text-sm">{successMessage}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (<div><label className="block text-sm text-gray-400 mb-1">Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="Enter your name" required /></div>)}
            <div><label className="block text-sm text-gray-400 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="Enter your email" required /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 pr-10" placeholder="Enter your password" required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>
            <button type="submit" disabled={authLoading} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">{authLoading && <Loader2 size={20} className="animate-spin" />}{authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
          </form>
          <p className="text-center text-gray-400 mt-4">{authMode === 'login' ? (<>Don&apos;t have an account? <button onClick={() => setAuthMode('register')} className="text-green-400 hover:underline">Sign up</button></>) : (<>Already have an account? <button onClick={() => setAuthMode('login')} className="text-green-400 hover:underline">Sign in</button></>)}</p>
        </div>
      </div>
    );
  };

  const NotificationDropdown = () => {
    if (!showNotifications) return null;
    return (
      <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
        <div className="p-4 border-b border-gray-700"><h3 className="font-semibold text-white">Notifications</h3></div>
        <div className="p-4"><div className="text-center text-gray-400 py-4"><Bell size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No new notifications</p><p className="text-xs mt-1">Price alerts will appear here</p></div></div>
        <div className="p-3 border-t border-gray-700"><p className="text-xs text-gray-500 text-center">Add items to your watchlist to receive price alerts</p></div>
      </div>
    );
  };

  if (loading) return (<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-center"><div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4"><span className="text-2xl font-bold text-white">₦</span></div><div className="flex items-center gap-2 text-white"><Loader2 className="animate-spin" /><span>Loading market data...</span></div></div></div>);
  if (error && !prices.length) return (<div className="min-h-screen bg-gray-950 flex items-center justify-center p-4"><div className="text-center max-w-md"><AlertCircle size={48} className="text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-white mb-2">Connection Error</h2><p className="text-gray-400 mb-4">{error}</p><button onClick={() => { setLoading(true); fetchData(); }} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg">Try Again</button></div></div>);

  const hasData = Object.keys(getPriceData.commodityPrices).length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AuthModal />
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"><span className="text-lg font-bold">₦</span></div>
              <div><span className="text-xl font-bold">Price<span className="text-green-400">Nija</span></span><span className="hidden sm:inline text-xs text-gray-500 ml-2">MARKET INTELLIGENCE</span></div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {['dashboard', 'prices', 'markets', 'watchlist'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium transition capitalize flex items-center gap-2 ${activeTab === tab ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  {tab === 'dashboard' && <Home size={18} />}{tab === 'prices' && <BarChart3 size={18} />}{tab === 'markets' && <MapPin size={18} />}{tab === 'watchlist' && <Star size={18} />}{tab}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button className="relative p-2 text-gray-400 hover:text-white" onClick={() => setShowNotifications(!showNotifications)}><Bell size={20} />{watchlist.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>}</button>
                <NotificationDropdown />
              </div>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm text-gray-400">{user.email?.split('@')[0]}</span>
                  <button onClick={async () => { await supabase.auth.signOut(); setUser(null); setWatchlist([]); }} className="p-2 text-gray-400 hover:text-white" title="Sign out"><LogOut size={20} /></button>
                </div>
              ) : (<button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition"><LogIn size={18} /><span className="hidden sm:inline">Sign In</span></button>)}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (<div className="md:hidden border-t border-gray-800 py-2 px-4">{['dashboard', 'prices', 'markets', 'watchlist'].map((tab) => (<button key={tab} onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}>{tab}</button>))}</div>)}
      </header>
      {showNotifications && <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />}
      <div className="bg-gray-900 border-b border-gray-800 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-green-400">Live</span></span>
            <span className="text-gray-500">Last updated: {lastUpdated?.toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Loading...'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{commodities.length} commodities • {markets.length} markets</span>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1 text-green-400 hover:text-green-300 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh</button>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold mb-1">Market Overview</h1><p className="text-gray-400">Real-time prices across Nigeria&apos;s top markets</p></div>
            {!hasData ? (<div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800"><AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Price Data Yet</h3><p className="text-gray-400 mb-4">Prices haven&apos;t been entered for today. Check back later or contact the admin.</p></div>) : (<>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4"><div className="flex justify-between items-start"><div><p className="text-green-200 text-sm">Avg. Grain Price</p><p className="text-2xl font-bold mt-1">{formatCompactPrice(Math.round(Object.values(getPriceData.commodityPrices).filter(p => p.commodity.category === 'Grains').reduce((sum, p) => sum + p.avgPrice, 0) / (Object.values(getPriceData.commodityPrices).filter(p => p.commodity.category === 'Grains').length || 1)))}</p><p className="text-green-200 text-xs mt-1">per 100kg bag</p></div><TrendingUp className="text-green-200" /></div></div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4"><div className="flex justify-between items-start"><div><p className="text-blue-200 text-sm">Best Market</p><p className="text-2xl font-bold mt-1">{getBestMarket?.name || 'N/A'}</p><p className="text-blue-200 text-xs mt-1">{getBestMarket ? `${getBestMarket.city}, ${getBestMarket.state}` : ''}</p></div><MapPin className="text-blue-200" /></div></div>
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-4"><div className="flex justify-between items-start"><div><p className="text-orange-200 text-sm">Most Volatile</p><p className="text-xl font-bold mt-1">{Object.values(getPriceData.commodityPrices).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0]?.commodity?.name || 'N/A'}</p><p className="text-orange-200 text-xs mt-1">{Math.abs(Object.values(getPriceData.commodityPrices).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0]?.change || 0).toFixed(1)}% this week</p></div><TrendingUp className="text-orange-200" /></div></div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4"><div className="flex justify-between items-start"><div><p className="text-purple-200 text-sm">Watchlist Items</p><p className="text-2xl font-bold mt-1">{watchlist.length}</p><p className="text-purple-200 text-xs mt-1">commodities tracked</p></div><Star className="text-purple-200" /></div></div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800"><h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-green-400" size={20} />Price Increases</h3><div className="space-y-3">{topGainers.length > 0 ? topGainers.map((item) => (<div key={item.commodity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"><div className="flex items-center gap-3"><span className="text-2xl">{getCommodityIcon(item.commodity)}</span><div><p className="font-medium">{item.commodity.name}</p><p className="text-xs text-gray-400">{item.lowestMarket?.name || 'N/A'}</p></div></div><span className="text-green-400 font-semibold">+{item.change.toFixed(1)}%</span></div>)) : <p className="text-gray-500 text-center py-4">No increases today</p>}</div></div>
                <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800"><h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingDown className="text-red-400" size={20} />Price Drops</h3><div className="space-y-3">{topLosers.length > 0 ? topLosers.map((item) => (<div key={item.commodity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"><div className="flex items-center gap-3"><span className="text-2xl">{getCommodityIcon(item.commodity)}</span><div><p className="font-medium">{item.commodity.name}</p><p className="text-xs text-gray-400">{item.lowestMarket?.name || 'N/A'}</p></div></div><span className="text-red-400 font-semibold">{item.change.toFixed(1)}%</span></div>)) : <p className="text-gray-500 text-center py-4">No drops today</p>}</div></div>
                <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800"><div className="flex justify-between items-center mb-4"><h3 className="font-semibold flex items-center gap-2"><Star className="text-yellow-400" size={20} />Your Watchlist</h3><button onClick={() => setActiveTab('watchlist')} className="text-green-400 text-sm hover:underline flex items-center gap-1">View All <ChevronRight size={14} /></button></div><div className="space-y-3">{watchlistItems.length > 0 ? watchlistItems.slice(0, 4).map((item) => (<div key={item.commodity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"><div className="flex items-center gap-3"><span className="text-2xl">{getCommodityIcon(item.commodity)}</span><div><p className="font-medium">{item.commodity.name}</p><p className="text-xs text-gray-400">Avg: {formatCompactPrice(item.avgPrice)}</p></div></div>{renderChangeIndicator(item.change)}</div>)) : <div className="text-center py-4"><p className="text-gray-500 mb-2">{user ? 'No items in watchlist' : 'Sign in to track prices'}</p>{!user && <button onClick={() => setShowAuthModal(true)} className="text-green-400 hover:underline text-sm">Create free account</button>}</div>}</div></div>
              </div>
            </>)}
          </div>
        )}
        {activeTab === 'prices' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search commodities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-green-500" /></div>
              <div className="flex flex-wrap gap-2">{categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedCategory === cat ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{cat}</button>))}</div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">{filteredCommodities.map((commodity) => { const priceData = getPriceData.commodityPrices[commodity.id]; return (<button key={commodity.id} onClick={() => { setSelectedCommodity(commodity); if (!priceHistory[`${commodity.id}-${selectedPeriod}`]) fetchCommodityHistory(commodity.id, selectedPeriod); }} className={`w-full flex items-center justify-between p-4 rounded-xl transition ${selectedCommodity?.id === commodity.id ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-900 border border-gray-800 hover:border-gray-700'}`}><div className="flex items-center gap-3"><span className="text-2xl">{getCommodityIcon(commodity)}</span><div className="text-left"><p className="font-medium">{commodity.name}</p><p className="text-xs text-gray-400">{commodity.unit}</p></div></div><div className="text-right">{priceData ? (<><p className="font-semibold">{formatCompactPrice(priceData.avgPrice)}</p>{renderChangeIndicator(priceData.change)}</>) : <p className="text-gray-500 text-sm">No data</p>}</div></button>); })}</div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {selectedCommodity && (<>
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <div className="flex items-start justify-between"><div className="flex items-center gap-4"><span className="text-4xl">{getCommodityIcon(selectedCommodity)}</span><div><div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{selectedCommodity.name}</h2><button onClick={() => toggleWatchlist(selectedCommodity.id)} className="text-yellow-400 hover:scale-110 transition">{isInWatchlist(selectedCommodity.id) ? <Star fill="currentColor" /> : <StarOff />}</button></div><p className="text-gray-400">{selectedCommodity.category} • {selectedCommodity.unit}</p></div></div></div>
                  {getPriceData.commodityPrices[selectedCommodity.id] && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"><div className="bg-gray-800 rounded-xl p-4"><p className="text-gray-400 text-sm">Average Price</p><p className="text-xl font-bold mt-1">{formatPrice(getPriceData.commodityPrices[selectedCommodity.id].avgPrice)}</p></div><div className="bg-green-900/30 rounded-xl p-4 border border-green-700"><p className="text-green-400 text-sm">Lowest Price</p><p className="text-xl font-bold mt-1 text-green-400">{formatPrice(getPriceData.commodityPrices[selectedCommodity.id].lowestPrice)}</p><p className="text-xs text-gray-400 mt-1">@ {getPriceData.commodityPrices[selectedCommodity.id].lowestMarket?.name}</p></div><div className="bg-red-900/30 rounded-xl p-4 border border-red-700"><p className="text-red-400 text-sm">Highest Price</p><p className="text-xl font-bold mt-1 text-red-400">{formatPrice(getPriceData.commodityPrices[selectedCommodity.id].highestPrice)}</p><p className="text-xs text-gray-400 mt-1">@ {getPriceData.commodityPrices[selectedCommodity.id].highestMarket?.name}</p></div><div className="bg-gray-800 rounded-xl p-4"><p className="text-gray-400 text-sm">Price Spread</p><p className="text-xl font-bold mt-1">{formatPrice(getPriceData.commodityPrices[selectedCommodity.id].priceSpread)}</p><p className="text-xs text-gray-400 mt-1">Potential savings</p></div></div>)}
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-semibold">Price Trend</h3><div className="flex gap-2">{['7d', '30d', '90d'].map((period) => (<button key={period} onClick={() => handlePeriodChange(period)} className={`px-3 py-1 rounded-lg text-sm transition ${selectedPeriod === period ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{period}</button>))}</div></div>
                  {priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]?.length > 0 ? (<ResponsiveContainer width="100%" height={250}><AreaChart data={priceHistory[`${selectedCommodity.id}-${selectedPeriod}`]}><defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" stroke="#9ca3af" fontSize={12} /><YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => '₦' + (val/1000) + 'K'} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(value) => [formatPrice(value), 'Price']} /><Area type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" /></AreaChart></ResponsiveContainer>) : (<div className="h-[250px] flex items-center justify-center text-gray-500">{priceHistory[`${selectedCommodity.id}-${selectedPeriod}`] === undefined ? <Loader2 className="animate-spin" /> : 'No historical data available'}</div>)}
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800"><h3 className="font-semibold mb-4">Prices by Market</h3><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-gray-400 text-sm border-b border-gray-800"><th className="pb-3">Market</th><th className="pb-3">Location</th><th className="pb-3 text-right">Price</th><th className="pb-3 text-right">vs Avg</th></tr></thead><tbody>{getPriceData.commodityPrices[selectedCommodity.id]?.marketPrices?.sort((a, b) => a.price - b.price).map((mp) => { const avgPrice = getPriceData.commodityPrices[selectedCommodity.id].avgPrice; const diff = ((mp.price - avgPrice) / avgPrice * 100).toFixed(1); return (<tr key={mp.market_id} className="border-b border-gray-800 hover:bg-gray-800/50"><td className="py-3 font-medium">{mp.market?.name}</td><td className="py-3 text-gray-400">{mp.market?.city}, {mp.market?.state}</td><td className="py-3 text-right font-semibold">{formatPrice(mp.price)}</td><td className="py-3 text-right"><span className={diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-gray-400'}>{diff > 0 ? '+' : ''}{diff}%</span></td></tr>); })}</tbody></table></div></div>
              </>)}
            </div>
          </div>
        )}
        {activeTab === 'markets' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold mb-1">Markets Directory</h1><p className="text-gray-400">Major commodity markets across Nigeria</p></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{markets.map((market) => { const marketData = getPriceData.marketPrices[market.id]; return (<Link href={"/markets/" + market.id} key={market.id}><div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition cursor-pointer"><div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold">{market.name}</h3><p className="text-gray-400 flex items-center gap-1 mt-1"><MapPin size={14} />{market.city}, {market.state}</p></div>{marketData && (<span className={`px-2 py-1 rounded-lg text-sm font-medium ${marketData.avgChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{marketData.avgChange >= 0 ? '+' : ''}{marketData.avgChange.toFixed(1)}%</span>)}</div><p className="text-gray-500 text-sm mb-4">{market.description}</p><div className="flex items-center justify-between pt-4 border-t border-gray-800"><span className="text-sm text-gray-400">{market.region}</span><div className="flex gap-1">{['🌽', '🍚', '🫘', '🥔', '🌾'].map((emoji, i) => (<span key={i} className="text-sm">{emoji}</span>))}</div></div></div></Link>); })}</div>
          </div>
        )}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold mb-1">Your Watchlist</h1><p className="text-gray-400">Track your favorite commodities</p></div>
            {!user ? (<div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800"><Star size={48} className="text-yellow-500 mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Sign in to use Watchlist</h3><p className="text-gray-400 mb-4">Create a free account to save your favorite commodities and get price alerts.</p><button onClick={() => setShowAuthModal(true)} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium">Sign In / Sign Up</button></div>) : watchlistItems.length === 0 ? (<div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800"><StarOff size={48} className="text-gray-600 mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Items in Watchlist</h3><p className="text-gray-400 mb-4">Start tracking commodities by clicking the star icon on any price.</p><button onClick={() => setActiveTab('prices')} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium">Browse Prices</button></div>) : (<div className="grid md:grid-cols-2 gap-6">{watchlistItems.map((item) => (<div key={item.commodity.id} className="bg-gray-900 rounded-2xl p-6 border border-gray-800"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><span className="text-3xl">{getCommodityIcon(item.commodity)}</span><div><h3 className="font-bold text-lg">{item.commodity.name}</h3><p className="text-gray-400 text-sm">{item.commodity.unit}</p></div></div><button onClick={() => toggleWatchlist(item.commodity.id)} className="text-yellow-400 hover:text-yellow-300"><Star fill="currentColor" /></button></div><div className="grid grid-cols-2 gap-4"><div className="bg-gray-800 rounded-xl p-3"><p className="text-gray-400 text-sm">Avg Price</p><p className="text-lg font-bold">{formatPrice(item.avgPrice)}</p><div className="mt-1">{renderChangeIndicator(item.change)}</div></div><div className="bg-green-900/30 rounded-xl p-3 border border-green-800"><p className="text-green-400 text-sm">Best Price</p><p className="text-lg font-bold text-green-400">{formatPrice(item.lowestPrice)}</p><p className="text-xs text-gray-400 mt-1">@ {item.lowestMarket?.name}</p></div></div><button onClick={() => { setSelectedCommodity(item.commodity); setActiveTab('prices'); }} className="w-full mt-4 py-2 text-green-400 hover:bg-green-500/10 rounded-lg font-medium flex items-center justify-center gap-2">View Details <ChevronRight size={18} /></button></div>))}</div>)}
          </div>
        )}
      </main>
      <footer className="bg-gray-900 border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"><span className="text-sm font-bold">₦</span></div><span className="font-bold">PriceNija</span></div>
            <p className="text-gray-400 text-sm text-center">Empowering farmers, traders, and consumers with real-time market intelligence</p>
            <div className="flex gap-4 text-sm text-gray-400"><button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition">About</button><a href="mailto:support@pricenija.com" className="hover:text-white transition">Contact</a></div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">© {new Date().getFullYear()} PriceNija. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
