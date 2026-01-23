'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
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

  // Fetch markets and commodities on load
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch prices when market or date changes
  useEffect(() => {
    if (selectedMarket && selectedDate) {
      fetchPrices();
    }
  }, [selectedMarket, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch markets
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .order('name');
      
      if (marketsError) throw marketsError;
      setMarkets(marketsData || []);
      if (marketsData?.length > 0) {
        setSelectedMarket(marketsData[0].id);
      }

      // Fetch commodities
      const { data: commoditiesData, error: commoditiesError } = await supabase
        .from('commodities')
        .select('*')
        .order('category, name');
      
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

      setStats({ todayEntries: todayCount || 0, totalRecords: totalCount || 0 });

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('commodity_id, price')
        .eq('market_id', selectedMarket)
        .eq('date', selectedDate);

      if (error) throw error;

      const priceMap = {};
      data?.forEach(p => {
        priceMap[p.commodity_id] = p.price;
      });
      setPrices(priceMap);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handlePriceChange = (commodityId, value) => {
    setPrices(prev => ({
      ...prev,
      [commodityId]: value === '' ? '' : parseFloat(value) || 0
    }));
  };

  const savePrices = async () => {
    if (!selectedMarket) {
      showToast('Please select a market', 'error');
      return;
    }

    setSaving(true);
    try {
      const pricesToSave = Object.entries(prices)
        .filter(([_, price]) => price !== '' && price > 0)
        .map(([commodityId, price]) => ({
          market_id: selectedMarket,
          commodity_id: commodityId,
          price: parseFloat(price),
          date: selectedDate,
          updated_at: new Date().toISOString()
        }));

      if (pricesToSave.length === 0) {
        showToast('No prices to save', 'error');
        setSaving(false);
        return;
      }

      // Upsert prices (insert or update)
      const { error } = await supabase
        .from('prices')
        .upsert(pricesToSave, { 
          onConflict: 'market_id,commodity_id,date',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      showToast(`Saved ${pricesToSave.length} prices successfully!`, 'success');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error saving prices:', error);
      showToast('Error saving prices: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const groupedCommodities = commodities.reduce((acc, commodity) => {
    const category = commodity.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(commodity);
    return acc;
  }, {});

  const getMarketName = (id) => markets.find(m => m.id === id)?.name || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-emerald-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 border-r border-stone-800 flex flex-col">
        <div className="p-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <div>
              <h1 className="font-bold text-lg">PriceNija</h1>
              <p className="text-xs text-stone-400">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
            { id: 'prices', icon: '💰', label: 'Price Entry' },
            { id: 'commodities', icon: '📦', label: 'Commodities' },
            { id: 'markets', icon: '📍', label: 'Markets' },
            { id: 'reports', icon: '📊', label: 'Reports' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <a href="/" className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors">
            <span>←</span>
            <span>Back to Public Site</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            {toast.message}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-stone-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6">
                <p className="text-emerald-100 text-sm">Total Commodities</p>
                <p className="text-3xl font-bold mt-2">{commodities.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
                <p className="text-blue-100 text-sm">Active Markets</p>
                <p className="text-3xl font-bold mt-2">{markets.length}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6">
                <p className="text-amber-100 text-sm">Today's Entries</p>
                <p className="text-3xl font-bold mt-2">{stats.todayEntries}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
                <p className="text-purple-100 text-sm">Total Records</p>
                <p className="text-3xl font-bold mt-2">{stats.totalRecords}</p>
              </div>
            </div>

            <div className="bg-stone-900 rounded-xl p-6 border border-stone-800">
              <h3 className="text-lg font-semibold mb-4">🚀 Getting Started</h3>
              <ol className="space-y-3 text-stone-300">
                <li>1. Go to <button onClick={() => setActiveTab('prices')} className="text-emerald-500 hover:underline">Price Entry</button> to add daily prices</li>
                <li>2. Select a market and date</li>
                <li>3. Enter prices for each commodity</li>
                <li>4. Click Save to store the data</li>
              </ol>
            </div>
          </div>
        )}

        {/* Price Entry Tab */}
        {activeTab === 'prices' && (
          <div>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Price Entry</h2>
                <p className="text-stone-400">Enter commodity prices for markets</p>
              </div>
              <button
                onClick={savePrices}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                {saving ? '⏳ Saving...' : '💾 Save All'}
              </button>
            </div>

            {/* Market & Date Selection */}
            <div className="bg-stone-900 rounded-xl p-6 border border-stone-800 mb-6">
              <h3 className="text-lg font-semibold mb-4">Select Market & Date</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-stone-400 mb-2">Market</label>
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {markets.map(market => (
                      <option key={market.id} value={market.id}>
                        {market.name} - {market.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Price Entry Form */}
            <div className="bg-stone-900 rounded-xl p-6 border border-stone-800">
              <h3 className="text-lg font-semibold mb-4">
                Enter Prices - {getMarketName(selectedMarket)}
              </h3>
              
              {Object.entries(groupedCommodities).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-medium text-stone-400 mb-3 uppercase tracking-wide">{category}</h4>
                  <div className="space-y-3">
                    {items.map(commodity => (
                      <div key={commodity.id} className="flex items-center justify-between bg-stone-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{commodity.icon || '📦'}</span>
                          <div>
                            <p className="font-medium">{commodity.name}</p>
                            <p className="text-sm text-stone-400">per {commodity.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400">₦</span>
                          <input
                            type="number"
                            value={prices[commodity.id] || ''}
                            onChange={(e) => handlePriceChange(commodity.id, e.target.value)}
                            placeholder="0"
                            className="w-32 bg-stone-700 border border-stone-600 rounded-lg px-4 py-2 text-right text-white focus:outline-none focus:border-emerald-500"
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

        {/* Commodities Tab */}
        {activeTab === 'commodities' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Commodities</h2>
            <div className="bg-stone-900 rounded-xl border border-stone-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-stone-800">
                  <tr>
                    <th className="text-left px-6 py-4 text-stone-400 font-medium">Name</th>
                    <th className="text-left px-6 py-4 text-stone-400 font-medium">Category</th>
                    <th className="text-left px-6 py-4 text-stone-400 font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {commodities.map(commodity => (
                    <tr key={commodity.id} className="border-t border-stone-800 hover:bg-stone-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{commodity.icon || '📦'}</span>
                          <span>{commodity.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-400">{commodity.category}</td>
                      <td className="px-6 py-4 text-stone-400">{commodity.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Markets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map(market => (
                <div key={market.id} className="bg-stone-900 rounded-xl p-6 border border-stone-800">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📍</span>
                    <h3 className="font-semibold text-lg">{market.name}</h3>
                  </div>
                  <p className="text-stone-400">{market.state}, {market.region}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Reports</h2>
            <div className="bg-stone-900 rounded-xl p-6 border border-stone-800">
              <p className="text-stone-400">Reports and analytics coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
