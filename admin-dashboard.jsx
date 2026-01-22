import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Home, Package, MapPin, DollarSign, Users, Settings, 
  Plus, Edit2, Trash2, Save, X, Check, AlertCircle, TrendingUp,
  TrendingDown, Calendar, Clock, Search, Filter, Download, Upload,
  ChevronDown, ChevronRight, Eye, RefreshCw, Bell, Menu, LogOut
} from 'lucide-react';

// Mock Data
const initialMarkets = [
  { id: 1, name: 'Dawanau', city: 'Kano', state: 'Kano', region: 'North-West', active: true },
  { id: 2, name: 'Mile 12', city: 'Lagos', state: 'Lagos', region: 'South-West', active: true },
  { id: 3, name: 'Bodija', city: 'Ibadan', state: 'Oyo', region: 'South-West', active: true },
  { id: 4, name: 'Ogbete Main', city: 'Enugu', state: 'Enugu', region: 'South-East', active: true },
  { id: 5, name: 'Wuse', city: 'Abuja', state: 'FCT', region: 'North-Central', active: true },
];

const initialCommodities = [
  { id: 1, name: 'Maize (White)', category: 'Grains', unit: 'per 100kg bag', icon: '🌽', active: true },
  { id: 2, name: 'Maize (Yellow)', category: 'Grains', unit: 'per 100kg bag', icon: '🌽', active: true },
  { id: 3, name: 'Rice (Local)', category: 'Grains', unit: 'per 50kg bag', icon: '🍚', active: true },
  { id: 4, name: 'Rice (Foreign)', category: 'Grains', unit: 'per 50kg bag', icon: '🍚', active: true },
  { id: 5, name: 'Sorghum', category: 'Grains', unit: 'per 100kg bag', icon: '🌾', active: true },
  { id: 6, name: 'Millet', category: 'Grains', unit: 'per 100kg bag', icon: '🌾', active: true },
  { id: 7, name: 'Beans (Brown)', category: 'Legumes', unit: 'per 100kg bag', icon: '🫘', active: true },
  { id: 8, name: 'Beans (White)', category: 'Legumes', unit: 'per 100kg bag', icon: '🫘', active: true },
  { id: 9, name: 'Soybeans', category: 'Legumes', unit: 'per 100kg bag', icon: '🫛', active: true },
  { id: 10, name: 'Groundnut', category: 'Legumes', unit: 'per 100kg bag', icon: '🥜', active: true },
  { id: 11, name: 'Cowpea', category: 'Legumes', unit: 'per 100kg bag', icon: '🫘', active: true },
  { id: 12, name: 'Garri (White)', category: 'Processed', unit: 'per 50kg bag', icon: '🥣', active: true },
  { id: 13, name: 'Garri (Yellow)', category: 'Processed', unit: 'per 50kg bag', icon: '🥣', active: true },
  { id: 14, name: 'Yam', category: 'Tubers', unit: 'per tuber', icon: '🍠', active: true },
  { id: 15, name: 'Tomatoes', category: 'Vegetables', unit: 'per 50kg basket', icon: '🍅', active: true },
  { id: 16, name: 'Pepper (Rodo)', category: 'Vegetables', unit: 'per 50kg basket', icon: '🌶️', active: true },
  { id: 17, name: 'Onions', category: 'Vegetables', unit: 'per 100kg bag', icon: '🧅', active: true },
  { id: 18, name: 'Palm Oil', category: 'Oils', unit: 'per 25 liters', icon: '🫒', active: true },
];

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);
};

const Sidebar = ({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'prices', label: 'Price Entry', icon: DollarSign },
    { id: 'commodities', label: 'Commodities', icon: Package },
    { id: 'markets', label: 'Markets', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`fixed top-0 left-0 h-full w-64 bg-stone-900 border-r border-stone-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-xl font-black text-white">N</span>
            </div>
            <div>
              <h1 className="font-black text-lg text-white">PriceNija</h1>
              <p className="text-xs text-stone-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSection === item.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-800/50">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-400 font-bold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-stone-500">admin@pricenija.ng</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
  };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-stone-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <Icon size={24} className="text-stone-300" />
        </div>
      </div>
    </div>
  );
};

export default function PriceNijaAdmin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [markets] = useState(initialMarkets);
  const [commodities] = useState(initialCommodities);
  const [toast, setToast] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMarket, setSelectedMarket] = useState(markets[0]?.id);
  const [priceEntries, setPriceEntries] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePriceChange = (commodityId, value) => {
    setPriceEntries(prev => ({ ...prev, [commodityId]: value }));
  };

  const savePrices = () => {
    const filledCount = Object.values(priceEntries).filter(v => v).length;
    showToast(`${filledCount} prices saved successfully!`);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-stone-400 hover:text-white">
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white capitalize">{activeSection}</h1>
                <p className="text-sm text-stone-500">
                  {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
              <RefreshCw size={16} />
              Sync
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Commodities" value={commodities.length} icon={Package} color="emerald" />
                <StatCard title="Active Markets" value={markets.length} icon={MapPin} color="blue" />
                <StatCard title="Today's Entries" value="0" icon={DollarSign} color="amber" />
                <StatCard title="Total Records" value="90" icon={BarChart3} color="rose" />
              </div>

              <div className="bg-stone-900/50 rounded-2xl border border-stone-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => setActiveSection('prices')} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-left">
                    <DollarSign className="text-emerald-400 mb-2" size={24} />
                    <p className="font-medium text-white">Enter Prices</p>
                    <p className="text-xs text-stone-500">Add today's prices</p>
                  </button>
                  <button onClick={() => setActiveSection('commodities')} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-left">
                    <Package className="text-blue-400 mb-2" size={24} />
                    <p className="font-medium text-white">Commodities</p>
                    <p className="text-xs text-stone-500">Manage items</p>
                  </button>
                  <button onClick={() => setActiveSection('markets')} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-left">
                    <MapPin className="text-amber-400 mb-2" size={24} />
                    <p className="font-medium text-white">Markets</p>
                    <p className="text-xs text-stone-500">Manage locations</p>
                  </button>
                  <button className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all text-left">
                    <Download className="text-rose-400 mb-2" size={24} />
                    <p className="font-medium text-white">Export Data</p>
                    <p className="text-xs text-stone-500">Download CSV</p>
                  </button>
                </div>
              </div>

              <div className="bg-stone-900/50 rounded-2xl border border-stone-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
                <div className="space-y-3 text-stone-400">
                  <p>1. Go to <span className="text-emerald-400">Price Entry</span> to add daily prices</p>
                  <p>2. Select a market and date</p>
                  <p>3. Enter prices for each commodity</p>
                  <p>4. Click Save to store the data</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'prices' && (
            <div className="space-y-6">
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-stone-400 mb-2">Select Market</label>
                    <select
                      value={selectedMarket}
                      onChange={(e) => setSelectedMarket(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {markets.map(m => (
                        <option key={m.id} value={m.id}>{m.name} - {m.city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-stone-400 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-stone-900/50 rounded-2xl border border-stone-800 overflow-hidden">
                <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white">
                    Enter Prices - {markets.find(m => m.id === selectedMarket)?.name}
                  </h3>
                  <button
                    onClick={savePrices}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    <Save size={16} />
                    Save All
                  </button>
                </div>
                
                <div className="divide-y divide-stone-800/50">
                  {['Grains', 'Legumes', 'Processed', 'Tubers', 'Vegetables', 'Oils'].map(category => {
                    const items = commodities.filter(c => c.category === category);
                    if (items.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <div className="px-4 py-2 bg-stone-800/30">
                          <h4 className="text-sm font-medium text-stone-400">{category}</h4>
                        </div>
                        <div className="p-4 grid gap-3">
                          {items.map(commodity => (
                            <div key={commodity.id} className="flex items-center gap-4 p-3 rounded-xl bg-stone-800/20">
                              <span className="text-2xl w-10">{commodity.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{commodity.name}</p>
                                <p className="text-xs text-stone-500">{commodity.unit}</p>
                              </div>
                              <div className="w-40">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">N</span>
                                  <input
                                    type="number"
                                    value={priceEntries[commodity.id] || ''}
                                    onChange={(e) => handlePriceChange(commodity.id, e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'commodities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Commodities</h2>
                  <p className="text-stone-500">{commodities.length} items tracked</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                  <Plus size={16} />
                  Add New
                </button>
              </div>

              <div className="bg-stone-900/50 rounded-2xl border border-stone-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-stone-800/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">Commodity</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">Category</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">Unit</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {commodities.map(item => (
                      <tr key={item.id} className="hover:bg-stone-800/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="font-medium text-white">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-stone-400">{item.category}</td>
                        <td className="p-4 text-stone-400">{item.unit}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
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

          {activeSection === 'markets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Markets</h2>
                  <p className="text-stone-500">{markets.length} locations tracked</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                  <Plus size={16} />
                  Add New
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.map(market => (
                  <div key={market.id} className="bg-stone-900/50 rounded-2xl border border-stone-800 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{market.name}</h3>
                        <p className="text-sm text-stone-400">{market.city}, {market.state}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{market.region}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Reports</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-stone-900/50 rounded-2xl border border-stone-800 p-6">
                  <Download className="text-emerald-400 mb-3" size={32} />
                  <h3 className="font-semibold text-white mb-2">Export All Prices</h3>
                  <p className="text-sm text-stone-500 mb-4">Download complete price data as CSV</p>
                  <button className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
                    Download CSV
                  </button>
                </div>
                <div className="bg-stone-900/50 rounded-2xl border border-stone-800 p-6">
                  <Calendar className="text-blue-400 mb-3" size={32} />
                  <h3 className="font-semibold text-white mb-2">Date Range Report</h3>
                  <p className="text-sm text-stone-500 mb-4">Export prices for specific period</p>
                  <button className="w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                    Select Dates
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <div className="bg-stone-900/50 rounded-2xl border border-stone-800 p-6">
                <h3 className="font-semibold text-white mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      defaultValue="admin@pricenija.ng"
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-400 mb-2">Password</label>
                    <input
                      type="password"
                      defaultValue="********"
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white"
                    />
                  </div>
                  <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        } text-white shadow-lg`}>
          <Check size={20} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
