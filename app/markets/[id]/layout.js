import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function generateMetadata({ params }) {
  // Fallback metadata if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      title: 'Market Details',
      description:
        'View commodity prices, location details, and price trends for this Nigerian market on PriceNija.',
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: market } = await supabase
      .from('markets')
      .select('name, city, state, description')
      .eq('id', params.id)
      .single();

    if (market) {
      return {
        title: `${market.name} - ${market.city}, ${market.state}`,
        description:
          market.description ||
          `View commodity prices, location details, and price trends for ${market.name} in ${market.city}, ${market.state} on PriceNija.`,
        openGraph: {
          title: `${market.name} Market Prices - PriceNija`,
          description: `Real-time commodity prices from ${market.name} in ${market.city}, ${market.state}.`,
        },
      };
    }
  } catch {
    // Fall through to default metadata
  }

  return {
    title: 'Market Details',
    description:
      'View commodity prices, location details, and price trends for this Nigerian market on PriceNija.',
  };
}

export default function MarketLayout({ children }) {
  return children;
}
