import './globals.css'

export const metadata = {
  title: 'PriceNija - Nigerian Commodity Market Price Tracker',
  description: 'Real-time agricultural commodity prices across Nigeria\'s major markets. Track prices for beans, maize, rice, and more.',
  keywords: 'Nigeria, commodity prices, market prices, beans, maize, rice, agriculture, farming, Dawanau, Mile 12, Bodija',
  authors: [{ name: 'PriceNija' }],
  openGraph: {
    title: 'PriceNija - Nigerian Commodity Market Price Tracker',
    description: 'Real-time agricultural commodity prices across Nigeria\'s major markets.',
    url: 'https://pricenija.com',
    siteName: 'PriceNija',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PriceNija - Nigerian Commodity Market Price Tracker',
    description: 'Real-time agricultural commodity prices across Nigeria\'s major markets.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className="bg-stone-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
