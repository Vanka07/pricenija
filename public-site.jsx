import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Search, TrendingUp, TrendingDown, MapPin, Bell, Filter, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Menu, X, Star, StarOff, Calendar, BarChart3, Home, Settings, Download, Share2, Eye, Clock } from 'lucide-react';

// ============================================
// DATA CONFIGURATION
// ============================================

const markets = [
  { id: 1, name: 'Dawanau', city: 'Kano', state: 'Kano', region: 'North-West', description: 'Largest grain market in West Africa' },
  { id: 2, name: 'Mile 12', city: 'Lagos', state: 'Lagos', region: 'South-West', description: 'Largest foodstuff market in Lagos' },
  { id: 3, name: 'Bodija', city: 'Ibadan', state: 'Oyo', region: 'South-West', description: 'Major wholesale agricultural hub' },
  { id: 4, name: 'Ogbete Main', city: 'Enugu', state: 'Enugu', region: 'South-East', description: 'Largest market in South-East' },
  { id: 5, name: 'Wuse', city: 'Abuja', state: 'FCT', region: 'North-Central', description: 'Federal Capital market hub' },
];

const commodities = [
  // Grains
  { id: 1, name: 'Maize (White)', category: 'Grains', unit: 'per 100kg bag', icon: '🌽' },
  { id: 2, name: 'Maize (Yellow)', category: 'Grains', unit: 'per 100kg bag', icon: '🌽' },
  { id: 3, name: 'Rice (Local)', category: 'Grains', unit: 'per 50kg bag', icon: '🍚' },
  { id: 4, name: 'Rice (Foreign)', category: 'Grains', unit: 'per 50kg bag', icon: '🍚' },
  { id: 5, name: 'Sorghum', category: 'Grains', unit: 'per 100kg bag', icon: '🌾' },
  { id: 6, name: 'Millet', category: 'Grains', unit: 'per 100kg bag', icon: '🌾' },
  // Legumes
  { id: 7, name: 'Beans (Brown)', category: 'Legumes', unit: 'per 100kg bag', icon: '🫘' },
  { id: 8, name: 'Beans (White)', category: 'Legumes', unit: 'per 100kg bag', icon: '🫘' },
  { id: 9, name: 'Soybeans', category: 'Legumes', unit: 'per 100kg bag', icon: '🫛' },
  { id: 10, name: 'Groundnut', category: 'Legumes', unit: 'per 100kg bag', icon: '🥜' },
  { id: 11, name: 'Cowpea', category: 'Legumes', unit: 'per 100kg bag', icon: '🫘' },
  // Processed
  { id: 12, name: 'Garri (White)', category: 'Processed', unit: 'per 50kg bag', icon: '🥣' },
  { id: 13, name: 'Garri (Yellow)', category: 'Processed', unit: 'per 50kg bag', icon: '🥣' },
  // Tubers
  { id: 14, name: 'Yam', category: 'Tubers', unit: 'per tuber', icon: '🍠' },
  // Vegetables
  { id: 15, name: 'Tomatoes', category: 'Vegetables', unit: 'per 50kg basket', icon: '🍅' },
  { id: 16, name: 'Pepper (Rodo)', category: 'Vegetables', unit: 'per 50kg basket', icon: '🌶️' },
  { id: 17, name: 'Onions', category: 'Vegetables', unit: 'per 100kg bag', icon: '🧅' },
  // Oils
  { id: 18, name: 'Palm Oil', category: 'Oils', unit: 'per 25 liters', icon: '🫒' },
];

// Base prices in Naira (realistic 2024/2025 prices)
const basePrices = {
  1: 75000,   // Maize White
  2: 72000,   // Maize Yellow
  3: 68000,   // Rice Local
  4: 85000,   // Rice Foreign
  5: 65000,   // Sorghum
  6: 58000,   // Millet
  7: 145000,  // Beans Brown
  8: 135000,  // Beans White
  9: 95000,   // Soybeans
  10: 120000, // Groundnut
  11: 140000, // Cowpea
  12: 45000,  // Garri White
  13: 48000,  // Garri Yellow
  14: 3500,   // Yam (per tuber)
  15: 85000,  // Tomatoes
  16: 75000,  // Pepper
  17: 95000,  // Onions
  18: 55000,  // Palm Oil
};

// Regional price multipliers
const regionMultipliers = {
  'North-West': 0.85,    // Generally cheaper (production zone)
  'North-Central': 0.95,
  'South-West': 1.15,    // Higher due to demand
  'South-East': 1.10,
  'South-South': 1.12,
};

// Generate realistic price data
const generatePriceData = () => {
  const data = [];
  commodities.forEach(commodity => {
    markets.forEach(market => {
      const basePrice = basePrices[commodity.id];
      const regionMult = regionMultipliers[market.region] || 1;
      const marketVariation = 0.95 + Math.random() * 0.10;
      const price = Math.round(basePrice * regionMult * marketVariation);
      const change = (Math.random() - 0.48) * 8; // Slightly more increases
      
      data.push({
        commodityId: commodity.id,
        marketId: market.id,
        price,
        previousPrice: Math.round(price / (1 + change/100)),
        change: parseFloat(change.toFixed(1)),
        lastUpdated: new Date(Date.now() - Math.random() * 7200000).toISOString(),
      });
    });
  });
  return data;
};

// Generate historical data
const generateHistoricalData = (commodityId, days = 30) => {
  const basePrice = basePrices[commodityId] || 50000;
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const trend = 1 + (days - i) * 0.003; // Slight upward trend
    const noise = 0.95 + Math.random() * 0.10;
    
    data.push({
      date: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
      price: Math.round(basePrice * trend * noise),
      fullDate: date.toISOString(),
    });
  }
  return data;
};

const priceData = generatePriceData();

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatCompactPrice = (price) => {
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 1000) {
    return `₦${(price / 1000).toFixed(0)}K`;
  }
  return `₦${price}`;
};

const getTimeAgo = (isoString) => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

// ============================================
// COMPONENTS
// ============================================

const PriceChange = ({ change, size = 'default' }) => {
  const sizeClasses = size === 'large' ? 'text-lg font-bold' : 'text-sm font-medium';
  
  if (change > 0) {
    return (
      <span className={`inline-flex items-center text-rose-500 ${sizeClasses}`}>
        <ArrowUpRight size={size === 'large' ? 20 : 16} />
        +{change.toFixed(1)}%
      </span>
    );
  } else if (change < 0) {
    return (
      <span className={`inline-flex items-center text-emerald-500 ${sizeClasses}`}>
        <ArrowDownRight size={size === 'large' ? 20 : 16} />
        {change.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center text-stone-400 ${sizeClasses}`}>
      <Minus size={size === 'large' ? 20 : 16} />
      0.0%
    </span>
  );
};

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  };
  
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-stone-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subValue && <p className="text-stone-400 text-xs mt-1">{subValue}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-xl bg-white/5">
            <Icon size={24} className="text-stone-300" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3">
          <PriceChange change={trend} />
        </div>
      )}
    </div>
  );
};

const CommodityCard = ({ commodity, priceInfo, isSelected, onClick }) => {
  const avgPrice = priceInfo.reduce((sum, p) => sum + p.price, 0) / priceInfo.length;
  const avgChange = priceInfo.reduce((sum, p) => sum + p.change, 0) / priceInfo.length;
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl transition-all duration-200 text-left group ${
        isSelected 
          ? 'bg-emerald-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
          : 'bg-stone-800/50 border border-stone-700/50 hover:bg-stone-800 hover:border-stone-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{commodity.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
            {commodity.name}
          </h3>
          <p className="text-xs text-stone-500">{commodity.unit}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-white">{formatCompactPrice(avgPrice)}</p>
          <PriceChange change={avgChange} />
        </div>
      </div>
    </button>
  );
};

const MarketPriceRow = ({ market, priceInfo, avgPrice, rank }) => {
  const vsAvg = ((priceInfo.price - avgPrice) / avgPrice * 100);
  const isBest = rank === 1;
  
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
      isBest ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-stone-800/30 hover:bg-stone-800/50'
    }`}>
      <div className="w-8 h-8 rounded-full bg-stone-700/50 flex items-center justify-center text-sm font-bold text-stone-400">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white">{market.name}</h4>
          {isBest && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Best Price
            </span>
          )}
        </div>
        <p className="text-sm text-stone-500 flex items-center gap-1">
          <MapPin size={12} />
          {market.city}, {market.state}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${isBest ? 'text-emerald-400' : 'text-white'}`}>
          {formatPrice(priceInfo.price)}
        </p>
        <div className="flex items-center gap-3 justify-end">
          <PriceChange change={priceInfo.change} />
          <span className={`text-xs ${vsAvg < 0 ? 'text-emerald-400' : vsAvg > 0 ? 'text-rose-400' : 'text-stone-500'}`}>
            {vsAvg > 0 ? '+' : ''}{vsAvg.toFixed(1)}% vs avg
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function PriceNija() {
  const [selectedCommodity, setSelectedCommodity] = useState(commodities[0]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [watchlist, setWatchlist] = useState([1, 3, 7, 15]);
  const [timeRange, setTimeRange] = useState('30d');

  const categories = ['All', ...new Set(commodities.map(c => c.category))];

  const filteredCommodities = useMemo(() => {
    return commodities.filter(c => {
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const commodityPrices = useMemo(() => {
    return priceData
      .filter(p => p.commodityId === selectedCommodity.id)
      .map(p => ({
        ...p,
        market: markets.find(m => m.id === p.marketId),
      }))
      .sort((a, b) => a.price - b.price);
  }, [selectedCommodity]);

  const historicalData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return generateHistoricalData(selectedCommodity.id, days);
  }, [selectedCommodity, timeRange]);

  const avgPrice = Math.round(commodityPrices.reduce((sum, p) => sum + p.price, 0) / commodityPrices.length);
  const lowestPrice = commodityPrices[0];
  const highestPrice = commodityPrices[commodityPrices.length - 1];
  const priceSpread = highestPrice?.price - lowestPrice?.price;

  const toggleWatchlist = (id) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Top movers calculation
  const topMovers = useMemo(() => {
    const allPrices = priceData.map(p => ({
      ...p,
      commodity: commodities.find(c => c.id === p.commodityId),
      market: markets.find(m => m.id === p.marketId),
    }));
    
    const gainers = [...allPrices].sort((a, b) => b.change - a.change).slice(0, 5);
    const losers = [...allPrices].sort((a, b) => a.change - b.change).slice(0, 5);
    
    return { gainers, losers };
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <span className="text-xl font-black text-white">₦</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight">
                  <span className="text-white">Price</span>
                  <span className="text-emerald-400">Nija</span>
                </h1>
                <p className="text-[10px] text-stone-500 font-medium tracking-wider uppercase">Market Intelligence</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'prices', label: 'Prices', icon: BarChart3 },
                { id: 'markets', label: 'Markets', icon: MapPin },
                { id: 'watchlist', label: 'Watchlist', icon: Star },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {tab.id === 'watchlist' && watchlist.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-emerald-500/30 text-emerald-400">
                      {watchlist.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/50 transition-all">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
              </button>
              <button
                className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-stone-900/95 backdrop-blur-xl border-t border-stone-800/50 px-4 py-3">
            {['dashboard', 'prices', 'markets', 'watchlist'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
                className={`block w-full text-left py-3 px-4 rounded-lg mb-1 ${
                  activeTab === tab ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Status Bar */}
      <div className="bg-stone-900/50 border-b border-stone-800/30 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </span>
            <span className="text-stone-500">
              Last updated: {new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <span className="text-stone-500">
            {commodities.length} commodities • {markets.length} markets
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Market Overview</h2>
                <p className="text-stone-400 mt-1">Real-time prices across Nigeria's top markets</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800/50 border border-stone-700/50 text-stone-300 hover:bg-stone-800 transition-all">
                  <Download size={16} />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all">
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Avg. Grain Price"
                value={formatCompactPrice(72000)}
                subValue="per 100kg bag"
                icon={TrendingUp}
                trend={2.3}
                color="emerald"
              />
              <StatCard
                title="Best Market"
                value="Dawanau"
                subValue="Kano, North-West"
                icon={MapPin}
                color="blue"
              />
              <StatCard
                title="Most Volatile"
                value="Tomatoes"
                subValue="+12.5% this week"
                icon={TrendingUp}
                trend={12.5}
                color="rose"
              />
              <StatCard
                title="Watchlist Items"
                value={watchlist.length}
                subValue="commodities tracked"
                icon={Star}
                color="amber"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Price Gainers/Losers */}
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                {/* Gainers */}
                <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-rose-400" size={20} />
                    <h3 className="font-semibold text-white">Price Increases</h3>
                  </div>
                  <div className="space-y-3">
                    {topMovers.gainers.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                        <span className="text-2xl">{item.commodity?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{item.commodity?.name}</p>
                          <p className="text-xs text-stone-500">{item.market?.name}</p>
                        </div>
                        <span className="text-rose-400 font-semibold">+{item.change.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers (Price Drops = Good for buyers) */}
                <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="text-emerald-400" size={20} />
                    <h3 className="font-semibold text-white">Price Drops</h3>
                  </div>
                  <div className="space-y-3">
                    {topMovers.losers.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-2xl">{item.commodity?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{item.commodity?.name}</p>
                          <p className="text-xs text-stone-500">{item.market?.name}</p>
                        </div>
                        <span className="text-emerald-400 font-semibold">{item.change.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Watchlist */}
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="text-amber-400" size={20} />
                    <h3 className="font-semibold text-white">Your Watchlist</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('watchlist')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  {watchlist.slice(0, 5).map(id => {
                    const commodity = commodities.find(c => c.id === id);
                    const prices = priceData.filter(p => p.commodityId === id);
                    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
                    const avgChange = prices.reduce((sum, p) => sum + p.change, 0) / prices.length;
                    
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-800/30 hover:bg-stone-800/50 transition-all cursor-pointer"
                        onClick={() => { setSelectedCommodity(commodity); setActiveTab('prices'); }}
                      >
                        <span className="text-2xl">{commodity?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{commodity?.name}</p>
                          <p className="text-xs text-stone-500">Avg: {formatCompactPrice(avgPrice)}</p>
                        </div>
                        <PriceChange change={avgChange} />
                      </div>
                    );
                  })}
                  {watchlist.length === 0 && (
                    <div className="text-center py-8 text-stone-500">
                      <StarOff size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No items in watchlist</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Market Comparison Quick View */}
            <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Regional Price Index</h3>
                <span className="text-xs text-stone-500">100 = National Average</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {markets.map(market => {
                  const marketPrices = priceData.filter(p => p.marketId === market.id);
                  // Calculate index relative to national average
                  const index = market.region === 'North-West' ? 85 : 
                               market.region === 'North-Central' ? 95 :
                               market.region === 'South-West' ? 112 :
                               market.region === 'South-East' ? 108 : 100;
                  
                  return (
                    <div key={market.id} className="p-4 rounded-xl bg-stone-800/30 text-center">
                      <p className="text-sm text-stone-400 mb-1">{market.name}</p>
                      <p className={`text-2xl font-bold ${
                        index < 100 ? 'text-emerald-400' : index > 100 ? 'text-rose-400' : 'text-white'
                      }`}>
                        {index}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {index < 100 ? `${100 - index}% below` : index > 100 ? `${index - 100}% above` : 'At average'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Prices Tab */}
        {activeTab === 'prices' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Commodity List */}
            <div className="lg:col-span-1">
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 overflow-hidden">
                <div className="p-4 border-b border-stone-800/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search commodities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-800/50 border border-stone-700/50 rounded-xl text-white placeholder-stone-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  
                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          selectedCategory === cat
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-stone-800/50 text-stone-400 border border-transparent hover:bg-stone-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto p-3 space-y-2">
                  {filteredCommodities.map(commodity => {
                    const prices = priceData.filter(p => p.commodityId === commodity.id);
                    return (
                      <CommodityCard
                        key={commodity.id}
                        commodity={commodity}
                        priceInfo={prices}
                        isSelected={selectedCommodity.id === commodity.id}
                        onClick={() => setSelectedCommodity(commodity)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commodity Header */}
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-stone-800/50 flex items-center justify-center text-4xl">
                      {selectedCommodity.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">{selectedCommodity.name}</h2>
                        <button
                          onClick={() => toggleWatchlist(selectedCommodity.id)}
                          className="p-1.5 rounded-lg hover:bg-stone-800 transition-all"
                        >
                          {watchlist.includes(selectedCommodity.id) ? (
                            <Star size={20} className="text-amber-400 fill-amber-400" />
                          ) : (
                            <StarOff size={20} className="text-stone-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-stone-400">{selectedCommodity.category} • {selectedCommodity.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-stone-800/30">
                    <p className="text-xs text-stone-500 mb-1">Average Price</p>
                    <p className="text-xl font-bold text-white">{formatPrice(avgPrice)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1">Lowest Price</p>
                    <p className="text-xl font-bold text-emerald-400">{formatPrice(lowestPrice?.price)}</p>
                    <p className="text-xs text-stone-500 mt-1">{lowestPrice?.market?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-xs text-rose-400 mb-1">Highest Price</p>
                    <p className="text-xl font-bold text-rose-400">{formatPrice(highestPrice?.price)}</p>
                    <p className="text-xs text-stone-500 mt-1">{highestPrice?.market?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-800/30">
                    <p className="text-xs text-stone-500 mb-1">Price Spread</p>
                    <p className="text-xl font-bold text-white">{formatPrice(priceSpread)}</p>
                    <p className="text-xs text-stone-500 mt-1">Potential savings</p>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Price Trend</h3>
                  <div className="flex items-center gap-1">
                    {['7d', '30d', '90d'].map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          timeRange === range
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#78716c' }} 
                        stroke="#44403c"
                        tickLine={false}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCompactPrice(value)}
                        tick={{ fontSize: 11, fill: '#78716c' }}
                        stroke="#44403c"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => [formatPrice(value), 'Price']}
                        contentStyle={{ 
                          backgroundColor: '#1c1917', 
                          border: '1px solid #292524',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                        }}
                        labelStyle={{ color: '#a8a29e' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Market Prices */}
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-6">
                <h3 className="font-semibold text-white mb-4">Prices by Market</h3>
                <div className="space-y-3">
                  {commodityPrices.map((item, index) => (
                    <MarketPriceRow
                      key={item.marketId}
                      market={item.market}
                      priceInfo={item}
                      avgPrice={avgPrice}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Markets Directory</h2>
              <p className="text-stone-400 mt-1">Major commodity markets across Nigeria</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map(market => {
                const marketPrices = priceData.filter(p => p.marketId === market.id);
                const avgChange = marketPrices.reduce((sum, p) => sum + p.change, 0) / marketPrices.length;
                
                return (
                  <div key={market.id} className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-5 hover:border-stone-700/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{market.name}</h3>
                        <p className="text-stone-400 text-sm flex items-center gap-1">
                          <MapPin size={14} />
                          {market.city}, {market.state}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        avgChange > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)}%
                      </span>
                    </div>
                    
                    <p className="text-stone-500 text-sm mb-4">{market.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-stone-800/50">
                      <span className="text-xs text-stone-500">{market.region}</span>
                      <div className="flex gap-1">
                        {commodities.slice(0, 5).map(c => (
                          <span key={c.id} className="text-sm" title={c.name}>{c.icon}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Watchlist</h2>
              <p className="text-stone-400 mt-1">Track your favorite commodities</p>
            </div>

            {watchlist.length === 0 ? (
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-12 text-center">
                <StarOff size={48} className="text-stone-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No items in watchlist</h3>
                <p className="text-stone-500 mb-4">Star commodities to add them to your watchlist</p>
                <button
                  onClick={() => setActiveTab('prices')}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                >
                  Browse Commodities
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {watchlist.map(id => {
                  const commodity = commodities.find(c => c.id === id);
                  const prices = priceData.filter(p => p.commodityId === id);
                  const avgPriceVal = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
                  const avgChange = prices.reduce((sum, p) => sum + p.change, 0) / prices.length;
                  const lowestPriceItem = prices.reduce((min, p) => p.price < min.price ? p : min, prices[0]);
                  const lowestMarket = markets.find(m => m.id === lowestPriceItem?.marketId);
                  
                  return (
                    <div key={id} className="bg-stone-900/50 rounded-2xl border border-stone-800/50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{commodity?.icon}</span>
                          <div>
                            <h3 className="font-semibold text-white">{commodity?.name}</h3>
                            <p className="text-sm text-stone-500">{commodity?.unit}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleWatchlist(id)}
                          className="p-2 rounded-lg hover:bg-stone-800 transition-all"
                        >
                          <Star size={20} className="text-amber-400 fill-amber-400" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-stone-800/30">
                          <p className="text-xs text-stone-500">Avg Price</p>
                          <p className="text-lg font-bold text-white">{formatPrice(avgPriceVal)}</p>
                          <PriceChange change={avgChange} />
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400">Best Price</p>
                          <p className="text-lg font-bold text-emerald-400">{formatPrice(lowestPriceItem?.price)}</p>
                          <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                            <MapPin size={10} />
                            {lowestMarket?.name}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => { setSelectedCommodity(commodity); setActiveTab('prices'); }}
                        className="w-full mt-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1"
                      >
                        View Details <ChevronRight size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative mt-12 border-t border-stone-800/50 bg-stone-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-sm font-black text-white">₦</span>
              </div>
              <span className="font-bold text-white">PriceNija</span>
            </div>
            <p className="text-sm text-stone-500 text-center">
              Empowering farmers, traders, and consumers with real-time market intelligence
            </p>
            <div className="flex items-center gap-6 text-sm text-stone-500">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">API</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-800/50 text-center text-xs text-stone-600">
            © {new Date().getFullYear()} PriceNija. Built for Nigeria 🇳🇬
          </div>
        </div>
      </footer>
    </div>
  );
}
