import { createBrowserClient } from '@supabase/ssr';

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

export const fetchLatestPrices = async () => {
    const { data, error } = await supabase
      .from('prices')
      .select(`
            *,
                  commodity:commodities(*),
                        market:markets(*)
                            `)
      .order('date', { ascending: false });
    return { data, error };
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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('prices')
      .select(`
            *,
                  market:markets(name)
                      `)
      .eq('commodity_id', commodityId)
      .gte('date', startDate.toISOString().split('T')[0])
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
