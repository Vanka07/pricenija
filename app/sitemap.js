import { createBrowserClient } from '@supabase/ssr';

export default async function sitemap() {
  const baseUrl = 'https://www.pricenija.com';
  const now = new Date();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/prices`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/markets`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/watchlist`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic market pages
  let marketPages = [];
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { data: markets } = await supabase
      .from('markets')
      .select('id, name')
      .eq('is_active', true);

    if (markets) {
      marketPages = markets.map((market) => ({
        url: `${baseUrl}/markets/${market.id}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch (e) {
    // Silently fail — static pages still get indexed
  }

  return [...staticPages, ...marketPages];
}
