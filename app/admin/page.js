'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Home, Package, MapPin, DollarSign, Settings,
  Save, Check, X, TrendingUp, Calendar, Clock, RefreshCw, Menu,
  LogOut, Download, ChevronLeft, User, Eye, EyeOff, Loader2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [markets, setMarkets] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ todayEntries: 0, totalRecords: 0 });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Check if user is admin
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!error && userData?.role === 'admin') {
            setIsAdmin(true);
          } else {
            // Auto-promote first user or specific email as admin
            // You can customize this logic
            const adminEmails = ['admin@pricenija.com', 'jamiu.awoke@gmail.com'];
            if (adminEmails.includes(user.email)) {
              // Update user role to admin
              await supabase
                .from('users')
                .upsert({ 
                  id: user.id, 
                  email: user.email, 
                  role: 'admin',
                  updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
              setIsAdmin(true);
            }
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  // Fetch prices when market or date changes
  useEffect(() => {
    if (selectedMarket && selectedDate && user && isAdmin) {
      fetchPrices();
    }
  }, [selectedMarket, selectedDate, user, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch markets
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (marketsError) throw marketsError;
      setMarkets(marketsData || []);
      if (marketsData?.length > 0 && !selectedMarket) {
        setSelectedMarket(marketsData[0].id);
      }

      // Fetch commodities
      const { data: commoditiesData, error: commoditiesError } = await supabase
        .from('commodities')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      if (commoditiesError) throw commoditiesError;
      setCommodities(commoditiesData || []);

      // Fetch stats
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('prices')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);
      
      const { count: totalCount } = await supabase
        .from('prices')
        .select('*', { count: 'exact', head: true });

      setStats({
        todayEntries: todayCount || 0,
        totalRecords: totalCount || 0,
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('market_id', selectedMarket)
        .eq('date', selectedDate);

      if (error) throw error;

      const priceMap = {};
      (data || []).forEach(p => {
        priceMap[p.commodity_id] = p.price;
      });
      setPrices(priceMap);

    } catch (err) {
      console.error('Error fetching prices:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check admin status
      const adminEmails = ['admin@pricenija.com', 'jamiu.awoke@gmail.com'];
      if (adminEmails.includes(loginEmail)) {
        await supabase
          .from('users')
          .upsert({ 
            id: data.user.id, 
            email: loginEmail, 
            role: 'admin',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        setIsAdmin(true);
      } else {
        // Check existing role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (userData?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('You do not have admin access. Contact the administrator.');
        }
        setIsAdmin(true);
      }

    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const handlePriceChange = (commodityId, value) => {
    const numValue = parseFloat(value) || 0;
    setPrices(prev => ({ ...prev, [commodityId]: numValue }));
  };

  const savePrices = async () => {
    if (!selectedMarket || !selectedDate) {
      showToast('Please select market and date', 'error');
      return;
    }

    setSaving(true);
    try {
      const pricesToSave = Object.entries(prices)
        .filter(([_, price]) => price > 0)
        .map(([commodityId, price]) => ({
          market_id: selectedMarket,
          commodity_id: commodityId,
          date: selectedDate,
          price: price,
          price_type: 'wholesale',
          created_by: user.id,
        }));

      if (pricesToSave.length === 0) {
        showToast('No prices to save', 'error');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('prices')
        .upsert(pricesToSave, {
          onConflict: 'market_id,commodity_id,date',
        });

      if (error) throw error;

      showToast(`${pricesToSave.length} prices saved successfully!`, 'success');
      fetchData(); // Refresh stats

    } catch (err) {
      console.error('Error saving prices:', err);
      showToast('Error saving prices: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getMarketName = (marketId) => {
    const market = markets.find(m => m.id === marketId);
    return market ? `${market.name} - ${market.state}` : '';
  };

  // Group commodities by category
  const groupedCommodities = commodities.reduce((acc, commodity) => {
    if (!acc[commodity.category]) acc[commodity.category] = [];
    acc[commodity.category].push(commodity);
    return acc;
  }, {});

  // ============================================
  // LOADING STATE
  // ============================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // LOGIN SCREEN
  // ============================================
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4">
              <span className="text-2xl font-bold text-white">₦</span>
            </div>
            <h1 className="text-2xl font-bold text-white">PriceNija Admin</h1>
            <p className="text-gray-400 mt-1">Sign in to manage prices</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg mb-6">
              <Lock size={18} />
              <span className="text-sm">Admin access required</span>
            </div>

            {loginError && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                  placeholder="admin@pricenija.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 pr-10"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading && <Loader2 size={20} className="animate-spin" />}
                Sign In to Admin
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <Link 
                href="/"
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-white"
              >
                <ChevronLeft size={18} />
                Back to Public Site
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN ADMIN DASHBOARD
  // ============================================
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <div>
              <h1 className="font-bold text-white">PriceNija</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'prices', icon: DollarSign, label: 'Price Entry' },
            { id: 'commodities', icon: Package, label: 'Commodities' },
            { id: 'markets', icon: MapPin, label: 'Markets' },
            { id: 'reports', icon: BarChart3, label: 'Reports' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <div className="px-4 py-2 text-sm text-gray-400">
            <p>Signed in as:</p>
            <p className="text-white truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronLeft size={18} />
            Back to Public Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={40} className="animate-spin text-green-500" />
          </div>
        ) : (
          <div className="p-6">
            {/* ============================================ */}
            {/* DASHBOARD TAB */}
            {/* ============================================ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                  <p className="text-gray-400">
                    {new Date().toLocaleDateString('en-NG', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-600 rounded-xl p-4">
                    <p className="text-green-200 text-sm">Total Commodities</p>
                    <p className="text-3xl font-bold text-white mt-1">{commodities.length}</p>
                  </div>
                  <div className="bg-blue-600 rounded-xl p-4">
                    <p className="text-blue-200 text-sm">Active Markets</p>
                    <p className="text-3xl font-bold text-white mt-1">{markets.length}</p>
                  </div>
                  <div className="bg-orange-600 rounded-xl p-4">
                    <p className="text-orange-200 text-sm">Today's Entries</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.todayEntries}</p>
                  </div>
                  <div className="bg-purple-600 rounded-xl p-4">
                    <p className="text-purple-200 text-sm">Total Records</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.totalRecords}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">🚀 Getting Started</h3>
                  <ol className="space-y-2 text-gray-300">
                    <li>1. Go to <button onClick={() => setActiveTab('prices')} className="text-green-400 hover:underline">Price Entry</button> to add daily prices</li>
                    <li>2. Select a market and date</li>
                    <li>3. Enter prices for each commodity</li>
                    <li>4. Click Save to store the data</li>
                  </ol>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* PRICE ENTRY TAB */}
            {/* ============================================ */}
            {activeTab === 'prices' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Price Entry</h2>
                    <p className="text-gray-400">Enter commodity prices for markets</p>
                  </div>
                  <button
                    onClick={savePrices}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save All
                  </button>
                </div>

                {/* Market & Date Selection */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Select Market & Date</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Market</label>
                      <select
                        value={selectedMarket}
                        onChange={(e) => setSelectedMarket(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      >
                        {markets.map((market) => (
                          <option key={market.id} value={market.id}>
                            {market.name} - {market.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Entry Form */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">
                    Enter Prices - {getMarketName(selectedMarket)}
                  </h3>
                  
                  {Object.entries(groupedCommodities).map(([category, items]) => (
                    <div key={category} className="mb-6">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {items.map((commodity) => (
                          <div 
                            key={commodity.id}
                            className="flex items-center justify-between p-4 bg-gray-800 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{commodity.icon}</span>
                              <div>
                                <p className="font-medium text-white">{commodity.name}</p>
                                <p className="text-xs text-gray-400">{commodity.unit}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">₦</span>
                              <input
                                type="number"
                                value={prices[commodity.id] || ''}
                                onChange={(e) => handlePriceChange(commodity.id, e.target.value)}
                                placeholder="0"
                                className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-green-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* COMMODITIES TAB */}
            {/* ============================================ */}
            {activeTab === 'commodities' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Commodities</h2>
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left p-4 text-gray-400 font-medium">Commodity</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Category</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Unit</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commodities.map((commodity) => (
                        <tr key={commodity.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{commodity.icon}</span>
                              <span className="text-white font-medium">{commodity.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400">{commodity.category}</td>
                          <td className="p-4 text-gray-400">{commodity.unit}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* MARKETS TAB */}
            {/* ============================================ */}
            {activeTab === 'markets' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Markets</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {markets.map((market) => (
                    <div key={market.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                      <h3 className="text-lg font-bold text-white">{market.name}</h3>
                      <p className="text-gray-400 mt-1">{market.city}, {market.state}</p>
                      <p className="text-sm text-gray-500 mt-2">{market.description}</p>
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <span className="text-xs text-gray-400">{market.region}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* REPORTS TAB */}
            {/* ============================================ */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Reports</h2>
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
                  <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Reports Coming Soon</h3>
                  <p className="text-gray-400">
                    Export functionality and detailed analytics will be available in the next update.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
