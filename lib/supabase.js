import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using fallback mode.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
  {
        auth: {
                persistSession: true,
                autoRefreshToken: true,
        },
  }
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
