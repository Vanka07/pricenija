import { createBrowserClient } from '@supabase/ssr';
import { PRICE_LOOKBACK_DAYS, subtractDays } from './priceWindow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using fallback mode.');
}

// Browser client for use in client components
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
  );

// Auth helper functions
export const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
                  data: {
                            full_name: fullName,
                  },
          },
    });
    return { data, error };
};

export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
};

export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange(callback);
};

// Database helper functions
export const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('name');
    return { data, error };
};

export const fetchCommodities = async () => {
    const { data, error } = await supabase
      .from('commodities')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    return { data, error };
};

export const fetchNewestPriceDate = async (filters = {}) => {
    let query = supabase
      .from('prices')
      .select('date')
      .order('date', { ascending: false })
      .limit(1);
    if (filters.commodityId) query = query.eq('commodity_id', filters.commodityId);
    if (filters.marketId) query = query.eq('market_id', filters.marketId);
    const { data, error } = await query.maybeSingle();
    return { date: data?.date || null, error };
};

export const fetchLatestPrices = async (options = {}) => {
    const lookbackDays = options.lookbackDays ?? PRICE_LOOKBACK_DAYS;
    const { date: newestDate, error: newestError } = await fetchNewestPriceDate({
      commodityId: options.commodityId,
      marketId: options.marketId,
    });
    if (newestError) return { data: null, error: newestError, newestDate: null };

    const startDate = subtractDays(newestDate, lookbackDays);
    let query = supabase
      .from('prices')
      .select(`
            *,
                  commodity:commodities(*),
                        market:markets(*)
                            `)
      .gte('date', startDate)
      .order('date', { ascending: false })
      .limit(options.limit ?? 5000);
    if (options.commodityId) query = query.eq('commodity_id', options.commodityId);
    if (options.marketId) query = query.eq('market_id', options.marketId);

    const { data, error } = await query;
    return { data, error, newestDate };
};

export const fetchPricesByDate = async (date) => {
    const { data, error } = await supabase
      .from('prices')
      .select(`
            *,
                  commodity:commodities(*),
                        market:markets(*)
                            `)
      .eq('date', date);
    return { data, error };
};

export const fetchPriceHistory = async (commodityId, days = 30) => {
    const { date: newestDate, error: newestError } = await fetchNewestPriceDate({ commodityId });
    if (newestError) return { data: null, error: newestError };

    const startDate = subtractDays(newestDate, days);

    const { data, error } = await supabase
      .from('prices')
      .select(`
            *,
                  market:markets(name)
                      `)
      .eq('commodity_id', commodityId)
      .gte('date', startDate)
      .order('date', { ascending: true });
    return { data, error };
};

export const fetchUserWatchlist = async (userId) => {
    const { data, error } = await supabase
      .from('watchlist')
      .select(`
            *,
                  commodity:commodities(*)
                      `)
      .eq('user_id', userId);
    return { data, error };
};

export const addToWatchlist = async (userId, commodityId) => {
    const { data, error } = await supabase
      .from('watchlist')
      .upsert({
              user_id: userId,
              commodity_id: commodityId,
      }, {
              onConflict: 'user_id,commodity_id',
      });
    return { data, error };
};

export const removeFromWatchlist = async (userId, commodityId) => {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('commodity_id', commodityId);
    return { error };
};

export const savePriceAlert = async (userId, commodityId, marketId, alertType, threshold) => {
    const { data, error } = await supabase
      .from('price_alerts')
      .upsert({
              user_id: userId,
              commodity_id: commodityId,
              market_id: marketId,
              alert_type: alertType,
              threshold_value: threshold,
              is_active: true,
      });
    return { data, error };
};

// Admin functions
export const savePrices = async (prices) => {
    const { data, error } = await supabase
      .from('prices')
      .upsert(prices, {
              onConflict: 'market_id,commodity_id,date',
      });
    return { data, error };
};

export const checkAdminRole = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    return { isAdmin: data?.role === 'admin', error };
};
