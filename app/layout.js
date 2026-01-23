import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
      // Basic Meta Tags
      title: 'PriceNija - Nigerian Commodity Market Price Tracker',
      description: 'Track real-time prices for grains, vegetables, tubers, and commodities across Nigeria\'s top markets. Compare prices, find the best deals, and make informed buying decisions.',
      keywords: 'Nigeria commodity prices, food prices Nigeria, market prices, grain prices, rice prices Nigeria, maize prices, agricultural prices, Dawanau market, Mile 12 market, Bodija market',
      authors: [{ name: 'PriceNija' }],
      creator: 'PriceNija',
      publisher: 'PriceNija',

      // Canonical URL
      alternates: {
              canonical: 'https://www.pricenija.com',
      },

      // Favicon & Icons
      icons: {
              icon: '/favicon.ico',
              apple: '/apple-touch-icon.png',
      },

      // Open Graph (Facebook, WhatsApp, LinkedIn)
      openGraph: {
              type: 'website',
              locale: 'en_NG',
              url: 'https://www.pricenija.com',
              siteName: 'PriceNija',
              title: 'PriceNija - Nigerian Commodity Market Price Tracker',
              description: 'Track real-time prices for grains, vegetables, tubers, and commodities across Nigeria\'s top markets. Compare prices and find the best deals.',
              images: [
                  {
                              url: 'https://www.pricenija.com/og-image.png',
                              width: 1200,
                              height: 630,
                              alt: 'PriceNija - Nigerian Commodity Market Price Tracker',
                  },
                      ],
      },

      // Twitter Card
      twitter: {
              card: 'summary_large_image',
              title: 'PriceNija - Nigerian Commodity Market Price Tracker',
              description: 'Track real-time prices for grains, vegetables, tubers, and commodities across Nigeria\'s top markets.',
              images: ['https://www.pricenija.com/og-image.png'],
              creator: '@pricenija',
      },

      // Robots & Indexing
      robots: {
              index: true,
              follow: true,
              googleBot: {
                        index: true,
                        follow: true,
                        'max-video-preview': -1,
                        'max-image-preview': 'large',
                        'max-snippet': -1,
              },
      },

      // Google Search Console Verification
      verification: {
              google: 'yFBhYaQ7g99fz1AWFh1cmHlTlARnuS3CO1Np46aYUnY',
      },

      // Additional Meta
      category: 'finance',
      classification: 'Business',
};

export const viewport = {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      themeColor: '#22c55e',
};

export default function RootLayout({ children }) {
      return (
              <html lang="en">
                <head>
      {/* Preconnect to external domains for performance */}
                  <link rel="preconnect" href="https://fonts.googleapis.com" />
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* JSON-LD Structured Data for Rich Snippets */}
        <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                              __html: JSON.stringify({
                                                '@context': 'https://schema.org',
                                                '@type': 'WebApplication',
                                                name: 'PriceNija',
                                                description: 'Track real-time commodity prices across Nigerian markets',
                                                url: 'https://www.pricenija.com',
                                                applicationCategory: 'FinanceApplication',
                                                operatingSystem: 'Any',
                                                offers: {
                                                                    '@type': 'Offer',
                                                                    price: '0',
                                                                    priceCurrency: 'NGN',
                                                },
                                                author: {
                                                                    '@type': 'Organization',
                                                                    name: 'PriceNija',
                                                                    url: 'https://www.pricenija.com',
                                                },
                              }),
              }}
        />
            </head>
      <body className={inter.className}>{children}</body>
            </html>
  );
}
