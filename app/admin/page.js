'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Home, Package, MapPin, DollarSign, Settings,
  Save, Check, X, TrendingUp, Calendar, Clock, RefreshCw, Menu,
  LogOut, Download, ChevronLeft, User, Eye, EyeOff, Loader2, Lock,
  Plus, Edit2, Trash2, Upload, History, Activity, Users, AlertTriangle,
  FileText, Filter, Search, ChevronDown, ChevronUp
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

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [showCommodityModal, setShowCommodityModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState(null);
  const [editingMarket, setEditingMarket] = useState(null);

  // Form states for modals
  const [commodityForm, setCommodityForm] = useState({
    name: '', category: 'Grains', unit: 'per 100kg bag', icon: '🌾', is_active: true
  });
  const [marketForm, setMarketForm] = useState({
    name: '', city: '', state: '', region: 'South-West', description: '', is_active: true
  });

  // Reports state
  const [reportType, setReportType] = useState('price-trends');
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });
  const [reportMarket, setReportMarket] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Price History state
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    market: 'all', commodity: 'all', startDate: '', endDate: ''
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Activity Log state
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Bulk Import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportData, setBulkImportData] = useState('');
  const [bulkImportPreview, setBulkImportPreview] = useState([]);

  // User Management state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Dashboard charts data
  const [chartData, setChartData] = useState({ weeklyEntries: [], topCommodities: [] });

  // Market Commodities state
  const [marketCommodities, setMarketCommodities] = useState({});
  const [selectedMarketForCommodities, setSelectedMarketForCommodities] = useState('');
  const [loadingMarketCommodities, setLoadingMarketCommodities] = useState(false);

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
            const adminEmails = ['admin@pricenija.com', 'jamiu.awoke@gmail.com'];
            if (adminEmails.includes(user.email)) {
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
      fetchChartData();
      fetchAllMarketCommodities();
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

  const fetchChartData = async () => {
    try {
      // Fetch weekly entries for chart
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weeklyData } = await supabase
        .from('prices')
        .select('date')
        .gte('date', weekAgo.toISOString().split('T')[0])
        .order('date');

      // Group by date
      const entriesByDate = {};
      (weeklyData || []).forEach(entry => {
        entriesByDate[entry.date] = (entriesByDate[entry.date] || 0) + 1;
      });

      const weeklyEntries = Object.entries(entriesByDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' }),
        count
      }));

      setChartData(prev => ({ ...prev, weeklyEntries }));
    } catch (err) {
      console.error('Error fetching chart data:', err);
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
    setPrices(prev => ({
      ...prev,
      [commodityId]: numValue
    }));
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

      // Log activity
      await logActivity('price_entry', `Added ${pricesToSave.length} prices for ${getMarketName(selectedMarket)} on ${selectedDate}`);

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

  // Activity logging
  const logActivity = async (action, details) => {
    try {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        user_email: user.email,
        action,
        details,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  // ============================================
  // COMMODITY CRUD OPERATIONS
  // ============================================
  const openCommodityModal = (commodity = null) => {
    if (commodity) {
      setEditingCommodity(commodity);
      setCommodityForm({
        name: commodity.name,
        category: commodity.category,
        unit: commodity.unit,
        icon: commodity.icon,
        is_active: commodity.is_active
      });
    } else {
      setEditingCommodity(null);
      setCommodityForm({
        name: '', category: 'Grains', unit: 'per 100kg bag', icon: '🌾', is_active: true
      });
    }
    setShowCommodityModal(true);
  };

  const saveCommodity = async () => {
    if (!commodityForm.name.trim()) {
      showToast('Please enter a commodity name', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingCommodity) {
        // Update existing
        const { error } = await supabase
          .from('commodities')
          .update({
            name: commodityForm.name,
            category: commodityForm.category,
            unit: commodityForm.unit,
            icon: commodityForm.icon,
            is_active: commodityForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCommodity.id);

        if (error) throw error;
        await logActivity('commodity_update', `Updated commodity: ${commodityForm.name}`);
        showToast('Commodity updated successfully!', 'success');
      } else {
        // Create new - generate slug from name
        const slug = commodityForm.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        const { error } = await supabase
          .from('commodities')
          .insert({
            name: commodityForm.name,
            slug: slug,
            category: commodityForm.category,
            unit: commodityForm.unit,
            icon: commodityForm.icon,
            is_active: commodityForm.is_active
          });

        if (error) throw error;
        await logActivity('commodity_create', `Created commodity: ${commodityForm.name}`);
        showToast('Commodity created successfully!', 'success');
      }

      setShowCommodityModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving commodity:', err);
      showToast('Error saving commodity: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCommodity = async (commodity) => {
    if (!confirm(`Are you sure you want to delete "${commodity.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('commodities')
        .delete()
        .eq('id', commodity.id);

      if (error) throw error;
      await logActivity('commodity_delete', `Deleted commodity: ${commodity.name}`);
      showToast('Commodity deleted successfully!', 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting commodity:', err);
      showToast('Error deleting commodity: ' + err.message, 'error');
    }
  };

  // ============================================
  // MARKET CRUD OPERATIONS
  // ============================================
  const openMarketModal = (market = null) => {
    if (market) {
      setEditingMarket(market);
      setMarketForm({
        name: market.name,
        city: market.city,
        state: market.state,
        region: market.region,
        description: market.description || '',
        is_active: market.is_active
      });
    } else {
      setEditingMarket(null);
      setMarketForm({
        name: '', city: '', state: '', region: 'South-West', description: '', is_active: true
      });
    }
    setShowMarketModal(true);
  };

  const saveMarket = async () => {
    if (!marketForm.name.trim() || !marketForm.city.trim() || !marketForm.state.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingMarket) {
        // Update existing
        const { error } = await supabase
          .from('markets')
          .update({
            name: marketForm.name,
            city: marketForm.city,
            state: marketForm.state,
            region: marketForm.region,
            description: marketForm.description,
            is_active: marketForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMarket.id);

        if (error) throw error;
        await logActivity('market_update', `Updated market: ${marketForm.name}`);
        showToast('Market updated successfully!', 'success');
      } else {
        // Create new
        const { error } = await supabase
          .from('markets')
          .insert({
            name: marketForm.name,
            city: marketForm.city,
            state: marketForm.state,
            region: marketForm.region,
            description: marketForm.description,
            is_active: marketForm.is_active
          });

        if (error) throw error;
        await logActivity('market_create', `Created market: ${marketForm.name}`);
        showToast('Market created successfully!', 'success');
      }

      setShowMarketModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving market:', err);
      showToast('Error saving market: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteMarket = async (market) => {
    if (!confirm(`Are you sure you want to delete "${market.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', market.id);

      if (error) throw error;
      await logActivity('market_delete', `Deleted market: ${market.name}`);
      showToast('Market deleted successfully!', 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting market:', err);
      showToast('Error deleting market: ' + err.message, 'error');
    }
  };

  // ============================================
  // REPORTS FUNCTIONS
  // ============================================
  const generateReport = async () => {
    setLoadingReport(true);
    try {
      let query = supabase.from('prices').select(`
        *,
        commodity:commodities(name, icon, category),
        market:markets(name, state)
      `);

      if (reportDateRange.start) {
        query = query.gte('date', reportDateRange.start);
      }
      if (reportDateRange.end) {
        query = query.lte('date', reportDateRange.end);
      }
      if (reportMarket !== 'all') {
        query = query.eq('market_id', reportMarket);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;

      setReportData(data);
    } catch (err) {
      console.error('Error generating report:', err);
      showToast('Error generating report', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = ['Date', 'Market', 'Commodity', 'Category', 'Price (₦)', 'Unit'];
    const rows = reportData.map(item => [
      item.date,
      item.market?.name || 'N/A',
      item.commodity?.name || 'N/A',
      item.commodity?.category || 'N/A',
      item.price,
      item.commodity?.unit || 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricenija-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Report exported successfully!', 'success');
  };

  // ============================================
  // PRICE HISTORY FUNCTIONS
  // ============================================
  const fetchPriceHistory = async () => {
    setLoadingHistory(true);
    try {
      let query = supabase.from('prices').select(`
        *,
        commodity:commodities(name, icon),
        market:markets(name, state)
      `);

      if (historyFilters.market !== 'all') {
        query = query.eq('market_id', historyFilters.market);
      }
      if (historyFilters.commodity !== 'all') {
        query = query.eq('commodity_id', historyFilters.commodity);
      }
      if (historyFilters.startDate) {
        query = query.gte('date', historyFilters.startDate);
      }
      if (historyFilters.endDate) {
        query = query.lte('date', historyFilters.endDate);
      }

      const { data, error } = await query.order('date', { ascending: false }).limit(100);
      if (error) throw error;

      setPriceHistory(data || []);
    } catch (err) {
      console.error('Error fetching price history:', err);
      showToast('Error fetching price history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const deletePriceEntry = async (priceId) => {
    if (!confirm('Are you sure you want to delete this price entry?')) return;

    try {
      const { error } = await supabase.from('prices').delete().eq('id', priceId);
      if (error) throw error;

      await logActivity('price_delete', `Deleted price entry ID: ${priceId}`);
      showToast('Price entry deleted', 'success');
      fetchPriceHistory();
      fetchData();
    } catch (err) {
      console.error('Error deleting price:', err);
      showToast('Error deleting price', 'error');
    }
  };

  // ============================================
  // ACTIVITY LOG FUNCTIONS
  // ============================================
  const fetchActivityLog = async () => {
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (err) {
      console.error('Error fetching activity log:', err);
      // Activity log table might not exist yet
      setActivityLog([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // ============================================
  // BULK IMPORT FUNCTIONS
  // ============================================
  const parseBulkImport = () => {
    try {
      const lines = bulkImportData.trim().split('\n');
      const preview = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const [commodityName, marketName, price] = parts;
          const commodity = commodities.find(c =>
            c.name.toLowerCase() === commodityName.toLowerCase()
          );
          const market = markets.find(m =>
            m.name.toLowerCase() === marketName.toLowerCase()
          );

          preview.push({
            commodityName,
            marketName,
            price: parseFloat(price) || 0,
            commodity,
            market,
            valid: !!(commodity && market && parseFloat(price) > 0)
          });
        }
      }

      setBulkImportPreview(preview);
    } catch (err) {
      showToast('Error parsing import data', 'error');
    }
  };

  const executeBulkImport = async () => {
    const validEntries = bulkImportPreview.filter(e => e.valid);
    if (validEntries.length === 0) {
      showToast('No valid entries to import', 'error');
      return;
    }

    setSaving(true);
    try {
      const pricesToSave = validEntries.map(entry => ({
        market_id: entry.market.id,
        commodity_id: entry.commodity.id,
        date: selectedDate,
        price: entry.price,
        price_type: 'wholesale',
        created_by: user.id,
      }));

      const { error } = await supabase
        .from('prices')
        .upsert(pricesToSave, {
          onConflict: 'market_id,commodity_id,date',
        });

      if (error) throw error;

      await logActivity('bulk_import', `Imported ${validEntries.length} prices`);
      showToast(`${validEntries.length} prices imported successfully!`, 'success');
      setShowBulkImport(false);
      setBulkImportData('');
      setBulkImportPreview([]);
      fetchData();
    } catch (err) {
      console.error('Error importing prices:', err);
      showToast('Error importing prices: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // USER MANAGEMENT FUNCTIONS
  // ============================================
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      await logActivity('user_role_update', `Updated user role to ${newRole}`);
      showToast('User role updated', 'success');
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      showToast('Error updating user role', 'error');
    }
  };

  // ============================================
  // MARKET COMMODITIES FUNCTIONS
  // ============================================
  const fetchAllMarketCommodities = async () => {
    try {
      const { data, error } = await supabase
        .from('market_commodities')
        .select('market_id, commodity_id');

      if (error) throw error;

      // Group by market
      const grouped = {};
      (data || []).forEach(item => {
        if (!grouped[item.market_id]) grouped[item.market_id] = [];
        grouped[item.market_id].push(item.commodity_id);
      });
      setMarketCommodities(grouped);
    } catch (err) {
      console.error('Error fetching market commodities:', err);
      // Table might not exist yet
      setMarketCommodities({});
    }
  };

  const toggleMarketCommodity = async (marketId, commodityId) => {
    const currentCommodities = marketCommodities[marketId] || [];
    const isAssigned = currentCommodities.includes(commodityId);

    try {
      if (isAssigned) {
        // Remove
        const { error } = await supabase
          .from('market_commodities')
          .delete()
          .eq('market_id', marketId)
          .eq('commodity_id', commodityId);

        if (error) throw error;

        setMarketCommodities(prev => ({
          ...prev,
          [marketId]: prev[marketId].filter(id => id !== commodityId)
        }));

        const commodity = commodities.find(c => c.id === commodityId);
        const market = markets.find(m => m.id === marketId);
        await logActivity('market_commodity_remove', `Removed ${commodity?.name} from ${market?.name}`);
      } else {
        // Add
        const { error } = await supabase
          .from('market_commodities')
          .insert({ market_id: marketId, commodity_id: commodityId });

        if (error) throw error;

        setMarketCommodities(prev => ({
          ...prev,
          [marketId]: [...(prev[marketId] || []), commodityId]
        }));

        const commodity = commodities.find(c => c.id === commodityId);
        const market = markets.find(m => m.id === marketId);
        await logActivity('market_commodity_add', `Added ${commodity?.name} to ${market?.name}`);
      }
    } catch (err) {
      console.error('Error toggling market commodity:', err);
      showToast('Error updating market commodity: ' + err.message, 'error');
    }
  };

  const assignAllCommoditiesToMarket = async (marketId) => {
    try {
      const commodityIds = commodities.filter(c => c.is_active).map(c => c.id);
      const existingIds = marketCommodities[marketId] || [];
      const newIds = commodityIds.filter(id => !existingIds.includes(id));

      if (newIds.length === 0) {
        showToast('All commodities already assigned', 'info');
        return;
      }

      const inserts = newIds.map(commodity_id => ({
        market_id: marketId,
        commodity_id
      }));

      const { error } = await supabase
        .from('market_commodities')
        .insert(inserts);

      if (error) throw error;

      setMarketCommodities(prev => ({
        ...prev,
        [marketId]: [...(prev[marketId] || []), ...newIds]
      }));

      const market = markets.find(m => m.id === marketId);
      await logActivity('market_commodity_assign_all', `Assigned all commodities to ${market?.name}`);
      showToast(`${newIds.length} commodities assigned successfully!`, 'success');
    } catch (err) {
      console.error('Error assigning all commodities:', err);
      showToast('Error assigning commodities: ' + err.message, 'error');
    }
  };

  const removeAllCommoditiesFromMarket = async (marketId) => {
    if (!confirm('Are you sure you want to remove all commodities from this market?')) return;

    try {
      const { error } = await supabase
        .from('market_commodities')
        .delete()
        .eq('market_id', marketId);

      if (error) throw error;

      setMarketCommodities(prev => ({
        ...prev,
        [marketId]: []
      }));

      const market = markets.find(m => m.id === marketId);
      await logActivity('market_commodity_remove_all', `Removed all commodities from ${market?.name}`);
      showToast('All commodities removed from market', 'success');
    } catch (err) {
      console.error('Error removing all commodities:', err);
      showToast('Error removing commodities: ' + err.message, 'error');
    }
  };

  // Get commodities available for a specific market (for price entry)
  const getMarketAvailableCommodities = (marketId) => {
    const assignedIds = marketCommodities[marketId] || [];
    // If no commodities assigned, show all (backwards compatibility)
    if (assignedIds.length === 0) return commodities.filter(c => c.is_active);
    return commodities.filter(c => c.is_active && assignedIds.includes(c.id));
  };

  // Group commodities by category
  const groupedCommodities = commodities.reduce((acc, commodity) => {
    if (!acc[commodity.category]) acc[commodity.category] = [];
    acc[commodity.category].push(commodity);
    return acc;
  }, {});

  // Group commodities by category for selected market (price entry)
  const getGroupedMarketCommodities = (marketId) => {
    const available = getMarketAvailableCommodities(marketId);
    return available.reduce((acc, commodity) => {
      if (!acc[commodity.category]) acc[commodity.category] = [];
      acc[commodity.category].push(commodity);
      return acc;
    }, {});
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'prices', icon: DollarSign, label: 'Price Entry' },
    { id: 'commodities', icon: Package, label: 'Commodities' },
    { id: 'markets', icon: MapPin, label: 'Markets' },
    { id: 'market-commodities', icon: Settings, label: 'Market Setup' },
    { id: 'history', icon: History, label: 'Price History' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'activity', icon: Activity, label: 'Activity Log' },
    { id: 'users', icon: Users, label: 'Users' },
  ];

  // Category options
  const categoryOptions = ['Grains', 'Legumes', 'Tubers', 'Vegetables', 'Fruits', 'Oils', 'Livestock', 'Other'];
  const regionOptions = ['South-West', 'South-East', 'South-South', 'North-West', 'North-East', 'North-Central'];
  const iconOptions = ['🌾', '🌽', '🍚', '🫘', '🥔', '🍠', '🥬', '🍅', '🥜', '🫒', '🐄', '🐔', '🐟', '🥚'];

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
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* Commodity Modal */}
      {showCommodityModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingCommodity ? 'Edit Commodity' : 'Add New Commodity'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={commodityForm.name}
                  onChange={(e) => setCommodityForm({...commodityForm, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Maize (White)"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={commodityForm.category}
                  onChange={(e) => setCommodityForm({...commodityForm, category: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={commodityForm.unit}
                  onChange={(e) => setCommodityForm({...commodityForm, unit: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., per 100kg bag"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCommodityForm({...commodityForm, icon})}
                      className={`w-10 h-10 text-xl rounded-lg ${
                        commodityForm.icon === icon
                          ? 'bg-green-500/30 border-2 border-green-500'
                          : 'bg-gray-800 border border-gray-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="commodity-active"
                  checked={commodityForm.is_active}
                  onChange={(e) => setCommodityForm({...commodityForm, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500"
                />
                <label htmlFor="commodity-active" className="text-gray-400 text-sm">Active</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCommodityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveCommodity}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingCommodity ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Market Modal */}
      {showMarketModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingMarket ? 'Edit Market' : 'Add New Market'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Market Name *</label>
                <input
                  type="text"
                  value={marketForm.name}
                  onChange={(e) => setMarketForm({...marketForm, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Bodija"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">City *</label>
                <input
                  type="text"
                  value={marketForm.city}
                  onChange={(e) => setMarketForm({...marketForm, city: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Ibadan"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">State *</label>
                <input
                  type="text"
                  value={marketForm.state}
                  onChange={(e) => setMarketForm({...marketForm, state: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Oyo"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Region</label>
                <select
                  value={marketForm.region}
                  onChange={(e) => setMarketForm({...marketForm, region: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  {regionOptions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={marketForm.description}
                  onChange={(e) => setMarketForm({...marketForm, description: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="Brief description of the market..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="market-active"
                  checked={marketForm.is_active}
                  onChange={(e) => setMarketForm({...marketForm, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500"
                />
                <label htmlFor="market-active" className="text-gray-400 text-sm">Active</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMarketModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveMarket}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingMarket ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Bulk Import Prices</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Paste CSV data (Commodity, Market, Price)
                </label>
                <textarea
                  value={bulkImportData}
                  onChange={(e) => setBulkImportData(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 font-mono text-sm"
                  placeholder="Maize (White), Bodija, 85000&#10;Rice (Local), Mile 12, 92000&#10;Beans (Brown), Dawanau, 145000"
                  rows={6}
                />
              </div>

              <button
                onClick={parseBulkImport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Preview Import
              </button>

              {bulkImportPreview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">Preview ({bulkImportPreview.filter(e => e.valid).length} valid entries)</h4>
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="text-left p-2 text-gray-400">Commodity</th>
                          <th className="text-left p-2 text-gray-400">Market</th>
                          <th className="text-right p-2 text-gray-400">Price</th>
                          <th className="text-center p-2 text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkImportPreview.map((entry, idx) => (
                          <tr key={idx} className={`border-t border-gray-700 ${!entry.valid ? 'opacity-50' : ''}`}>
                            <td className="p-2 text-white">{entry.commodityName}</td>
                            <td className="p-2 text-white">{entry.marketName}</td>
                            <td className="p-2 text-white text-right">₦{entry.price.toLocaleString()}</td>
                            <td className="p-2 text-center">
                              {entry.valid ? (
                                <Check size={16} className="text-green-500 inline" />
                              ) : (
                                <X size={16} className="text-red-500 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkImportData('');
                  setBulkImportPreview([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkImport}
                disabled={saving || bulkImportPreview.filter(e => e.valid).length === 0}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Import {bulkImportPreview.filter(e => e.valid).length} Prices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">₦</span>
          </div>
          <span className="font-bold text-white">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo - Hidden on mobile (shown in header) */}
        <div className="hidden md:block p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">₦</span>
            </div>
            <div>
              <h1 className="font-bold text-white">PriceNija</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Mobile close button area */}
        <div className="md:hidden p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="font-bold text-white">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
                // Fetch data for specific tabs
                if (item.id === 'history') fetchPriceHistory();
                if (item.id === 'activity') fetchActivityLog();
                if (item.id === 'users') fetchUsers();
              }}
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
            <p className="text-white truncate text-xs sm:text-sm">{user.email}</p>
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
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 md:h-full">
            <Loader2 size={40} className="animate-spin text-green-500" />
          </div>
        ) : (
          <div className="p-4 md:p-6">
            {/* ============================================ */}
            {/* DASHBOARD TAB */}
            {/* ============================================ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Dashboard</h2>
                  <p className="text-sm md:text-base text-gray-400">
                    {new Date().toLocaleDateString('en-NG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-green-600 rounded-xl p-3 md:p-4">
                    <p className="text-green-200 text-xs md:text-sm">Total Commodities</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">{commodities.length}</p>
                  </div>
                  <div className="bg-blue-600 rounded-xl p-3 md:p-4">
                    <p className="text-blue-200 text-xs md:text-sm">Active Markets</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">{markets.filter(m => m.is_active).length}</p>
                  </div>
                  <div className="bg-orange-600 rounded-xl p-3 md:p-4">
                    <p className="text-orange-200 text-xs md:text-sm">Today&apos;s Entries</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.todayEntries}</p>
                  </div>
                  <div className="bg-purple-600 rounded-xl p-3 md:p-4">
                    <p className="text-purple-200 text-xs md:text-sm">Total Records</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.totalRecords}</p>
                  </div>
                </div>

                {/* Weekly Activity Chart */}
                {chartData.weeklyEntries.length > 0 && (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                    <h3 className="font-semibold text-white mb-4">📊 Weekly Price Entries</h3>
                    <div className="flex items-end justify-between h-32 gap-2">
                      {chartData.weeklyEntries.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-green-500 rounded-t"
                            style={{
                              height: `${Math.max(10, (day.count / Math.max(...chartData.weeklyEntries.map(d => d.count))) * 100)}%`
                            }}
                          />
                          <span className="text-xs text-gray-400 mt-2">{day.date}</span>
                          <span className="text-xs text-white">{day.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">🚀 Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveTab('prices')}
                      className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 text-center"
                    >
                      <DollarSign size={24} className="text-green-400 mx-auto mb-2" />
                      <span className="text-sm text-white">Add Prices</span>
                    </button>
                    <button
                      onClick={() => setShowBulkImport(true)}
                      className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 text-center"
                    >
                      <Upload size={24} className="text-blue-400 mx-auto mb-2" />
                      <span className="text-sm text-white">Bulk Import</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('reports'); generateReport(); }}
                      className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 text-center"
                    >
                      <BarChart3 size={24} className="text-purple-400 mx-auto mb-2" />
                      <span className="text-sm text-white">View Reports</span>
                    </button>
                    <button
                      onClick={() => openCommodityModal()}
                      className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 text-center"
                    >
                      <Plus size={24} className="text-orange-400 mx-auto mb-2" />
                      <span className="text-sm text-white">Add Commodity</span>
                    </button>
                  </div>
                </div>

                {/* Getting Started */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">📚 Getting Started</h3>
                  <ol className="space-y-2 text-sm md:text-base text-gray-300">
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
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Price Entry</h2>
                    <p className="text-sm md:text-base text-gray-400">Enter commodity prices for markets</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBulkImport(true)}
                      className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium"
                    >
                      <Upload size={18} />
                      Bulk Import
                    </button>
                    <button
                      onClick={savePrices}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save All
                    </button>
                  </div>
                </div>

                {/* Market & Date Selection */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Select Market & Date</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Market</label>
                      <select
                        value={selectedMarket}
                        onChange={(e) => setSelectedMarket(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 text-sm md:text-base"
                      >
                        {markets.filter(m => m.is_active).map((market) => (
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
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 text-sm md:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Entry Form */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                    <h3 className="font-semibold text-white text-sm md:text-base">
                      Enter Prices - {getMarketName(selectedMarket)}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {getMarketAvailableCommodities(selectedMarket).length} commodities available
                    </span>
                  </div>

                  {Object.entries(getGroupedMarketCommodities(selectedMarket)).length === 0 ? (
                    <div className="text-center py-8">
                      <Package size={40} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No commodities assigned to this market.</p>
                      <p className="text-sm text-gray-500 mt-1">Go to "Market Setup" to assign commodities.</p>
                    </div>
                  ) : (
                    Object.entries(getGroupedMarketCommodities(selectedMarket)).map(([category, items]) => (
                    <div key={category} className="mb-6">
                      <h4 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {items.map((commodity) => (
                          <div
                            key={commodity.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-800 rounded-xl gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl md:text-2xl">{commodity.icon}</span>
                              <div>
                                <p className="font-medium text-white text-sm md:text-base">{commodity.name}</p>
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
                                className="w-full sm:w-28 md:w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-green-500 text-sm md:text-base"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* MARKET COMMODITIES SETUP TAB */}
            {/* ============================================ */}
            {activeTab === 'market-commodities' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Market Commodity Setup</h2>
                  <p className="text-sm text-gray-400 mt-1">Configure which commodities are available in each market</p>
                </div>

                {/* Market Selection */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Select Market</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedMarketForCommodities}
                      onChange={(e) => setSelectedMarketForCommodities(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="">Select a market...</option>
                      {markets.filter(m => m.is_active).map((market) => (
                        <option key={market.id} value={market.id}>
                          {market.name} - {market.state}
                        </option>
                      ))}
                    </select>
                    {selectedMarketForCommodities && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => assignAllCommoditiesToMarket(selectedMarketForCommodities)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm whitespace-nowrap"
                        >
                          Assign All
                        </button>
                        <button
                          onClick={() => removeAllCommoditiesFromMarket(selectedMarketForCommodities)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm whitespace-nowrap"
                        >
                          Remove All
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedMarketForCommodities ? (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-white">
                        Commodities for {markets.find(m => m.id === selectedMarketForCommodities)?.name}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {(marketCommodities[selectedMarketForCommodities] || []).length} of {commodities.filter(c => c.is_active).length} assigned
                      </span>
                    </div>

                    {Object.entries(groupedCommodities).map(([category, items]) => (
                      <div key={category} className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                            {category}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {items.filter(c => c.is_active && (marketCommodities[selectedMarketForCommodities] || []).includes(c.id)).length}/{items.filter(c => c.is_active).length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {items.filter(c => c.is_active).map((commodity) => {
                            const isAssigned = (marketCommodities[selectedMarketForCommodities] || []).includes(commodity.id);
                            return (
                              <button
                                key={commodity.id}
                                onClick={() => toggleMarketCommodity(selectedMarketForCommodities, commodity.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                  isAssigned
                                    ? 'bg-green-500/20 border-green-500 text-white'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                              >
                                <span className="text-lg">{commodity.icon}</span>
                                <span className="text-sm font-medium flex-1 text-left">{commodity.name}</span>
                                {isAssigned ? (
                                  <Check size={16} className="text-green-400" />
                                ) : (
                                  <Plus size={16} className="text-gray-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
                    <MapPin size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">Select a market above to configure its commodities</p>
                    <p className="text-sm text-gray-500 mt-1">You can assign specific commodities to each market</p>
                  </div>
                )}

                {/* Quick Overview */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Market Overview</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {markets.filter(m => m.is_active).map((market) => {
                      const assignedCount = (marketCommodities[market.id] || []).length;
                      const totalActive = commodities.filter(c => c.is_active).length;
                      return (
                        <div
                          key={market.id}
                          onClick={() => setSelectedMarketForCommodities(market.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedMarketForCommodities === market.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-white text-sm">{market.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              assignedCount === 0
                                ? 'bg-red-500/20 text-red-400'
                                : assignedCount === totalActive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {assignedCount}/{totalActive}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{market.state}</p>
                          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${totalActive > 0 ? (assignedCount / totalActive) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* COMMODITIES TAB */}
            {/* ============================================ */}
            {activeTab === 'commodities' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Commodities</h2>
                  <button
                    onClick={() => openCommodityModal()}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Plus size={18} />
                    Add New
                  </button>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {commodities.map((commodity) => (
                    <div key={commodity.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{commodity.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{commodity.name}</p>
                          <p className="text-xs text-gray-400">{commodity.category}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          commodity.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {commodity.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">Unit: {commodity.unit}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCommodityModal(commodity)}
                          className="flex-1 px-3 py-2 bg-gray-800 text-blue-400 rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteCommodity(commodity)}
                          className="flex-1 px-3 py-2 bg-gray-800 text-red-400 rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="text-left p-4 text-gray-400 font-medium">Commodity</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Category</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Unit</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                          <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
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
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                commodity.is_active
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {commodity.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openCommodityModal(commodity)}
                                  className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => deleteCommodity(commodity)}
                                  className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* MARKETS TAB */}
            {/* ============================================ */}
            {activeTab === 'markets' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Markets</h2>
                  <button
                    onClick={() => openMarketModal()}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Plus size={18} />
                    Add New
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {markets.map((market) => (
                    <div key={market.id} className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-white">{market.name}</h3>
                          <p className="text-sm md:text-base text-gray-400 mt-1">{market.city}, {market.state}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          market.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {market.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 mt-2 line-clamp-2">{market.description}</p>
                      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-xs text-gray-400">{market.region}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openMarketModal(market)}
                            className="p-2 text-blue-400 hover:bg-gray-800 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteMarket(market)}
                            className="p-2 text-red-400 hover:bg-gray-800 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* PRICE HISTORY TAB */}
            {/* ============================================ */}
            {activeTab === 'history' && (
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">Price History</h2>

                {/* Filters */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Market</label>
                      <select
                        value={historyFilters.market}
                        onChange={(e) => setHistoryFilters({...historyFilters, market: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="all">All Markets</option>
                        {markets.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Commodity</label>
                      <select
                        value={historyFilters.commodity}
                        onChange={(e) => setHistoryFilters({...historyFilters, commodity: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="all">All Commodities</option>
                        {commodities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">From Date</label>
                      <input
                        type="date"
                        value={historyFilters.startDate}
                        onChange={(e) => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">To Date</label>
                      <input
                        type="date"
                        value={historyFilters.endDate}
                        onChange={(e) => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={fetchPriceHistory}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <Filter size={16} />
                    Apply Filters
                  </button>
                </div>

                {/* History Table */}
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-green-500" />
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="text-left p-3 text-gray-400">Date</th>
                            <th className="text-left p-3 text-gray-400">Market</th>
                            <th className="text-left p-3 text-gray-400">Commodity</th>
                            <th className="text-right p-3 text-gray-400">Price (₦)</th>
                            <th className="text-center p-3 text-gray-400">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceHistory.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400">
                                No price history found. Apply filters and search.
                              </td>
                            </tr>
                          ) : (
                            priceHistory.map((entry) => (
                              <tr key={entry.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                                <td className="p-3 text-white">{entry.date}</td>
                                <td className="p-3 text-gray-300">{entry.market?.name || 'N/A'}</td>
                                <td className="p-3 text-gray-300">
                                  <span className="mr-2">{entry.commodity?.icon}</span>
                                  {entry.commodity?.name || 'N/A'}
                                </td>
                                <td className="p-3 text-white text-right">₦{entry.price?.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => deletePriceEntry(entry.id)}
                                    className="p-1 text-red-400 hover:bg-gray-700 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* REPORTS TAB */}
            {/* ============================================ */}
            {activeTab === 'reports' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Reports</h2>
                  <button
                    onClick={exportToCSV}
                    disabled={!reportData || reportData.length === 0}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                </div>

                {/* Report Filters */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Generate Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Market</label>
                      <select
                        value={reportMarket}
                        onChange={(e) => setReportMarket(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="all">All Markets</option>
                        {markets.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">From Date</label>
                      <input
                        type="date"
                        value={reportDateRange.start}
                        onChange={(e) => setReportDateRange({...reportDateRange, start: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">To Date</label>
                      <input
                        type="date"
                        value={reportDateRange.end}
                        onChange={(e) => setReportDateRange({...reportDateRange, end: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={generateReport}
                        disabled={loadingReport}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loadingReport && <Loader2 size={16} className="animate-spin" />}
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report Results */}
                {loadingReport ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-green-500" />
                  </div>
                ) : reportData ? (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800">
                      <p className="text-gray-400">
                        Found <span className="text-white font-semibold">{reportData.length}</span> records
                      </p>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800 sticky top-0">
                          <tr>
                            <th className="text-left p-3 text-gray-400">Date</th>
                            <th className="text-left p-3 text-gray-400">Market</th>
                            <th className="text-left p-3 text-gray-400">Commodity</th>
                            <th className="text-left p-3 text-gray-400">Category</th>
                            <th className="text-right p-3 text-gray-400">Price (₦)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((entry, idx) => (
                            <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/50">
                              <td className="p-3 text-white">{entry.date}</td>
                              <td className="p-3 text-gray-300">{entry.market?.name || 'N/A'}</td>
                              <td className="p-3 text-gray-300">
                                <span className="mr-2">{entry.commodity?.icon}</span>
                                {entry.commodity?.name || 'N/A'}
                              </td>
                              <td className="p-3 text-gray-400">{entry.commodity?.category || 'N/A'}</td>
                              <td className="p-3 text-white text-right">₦{entry.price?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800 text-center">
                    <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Generate a Report</h3>
                    <p className="text-sm md:text-base text-gray-400">
                      Select filters above and click Generate to view price data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* ACTIVITY LOG TAB */}
            {/* ============================================ */}
            {activeTab === 'activity' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Activity Log</h2>
                  <button
                    onClick={fetchActivityLog}
                    className="flex items-center gap-2 text-gray-400 hover:text-white"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                </div>

                {loadingActivity ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-green-500" />
                  </div>
                ) : activityLog.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800 text-center">
                    <Activity size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Activity Yet</h3>
                    <p className="text-gray-400">
                      Activity will be logged as you make changes in the admin panel.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="divide-y divide-gray-800">
                      {activityLog.map((log, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-800/50">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                              <Activity size={14} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm">{log.details}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{log.user_email}</span>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.created_at).toLocaleString('en-NG')}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                              {log.action}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* USERS TAB */}
            {/* ============================================ */}
            {activeTab === 'users' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-bold text-white">User Management</h2>
                  <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 text-gray-400 hover:text-white"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                </div>

                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-green-500" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800 text-center">
                    <Users size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Users Found</h3>
                    <p className="text-gray-400">
                      Users will appear here once they sign up.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="text-left p-3 text-gray-400">Email</th>
                            <th className="text-left p-3 text-gray-400">Role</th>
                            <th className="text-left p-3 text-gray-400">Joined</th>
                            <th className="text-center p-3 text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                              <td className="p-3 text-white">{u.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  u.role === 'admin'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {u.role || 'user'}
                                </span>
                              </td>
                              <td className="p-3 text-gray-400">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3 text-center">
                                {u.id !== user.id && (
                                  <select
                                    value={u.role || 'user'}
                                    onChange={(e) => updateUserRole(u.id, e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
