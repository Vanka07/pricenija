import './globals.css'

export const metadata = {
  title: 'PriceNija - Nigerian Commodity Market Price Tracker',
  description: 'Real-time agricultural commodity prices across Nigeria\'s major markets. Track prices for beans, maize, rice, and more.',
  keywords: 'Nigeria, commodity prices, market prices, beans, maize, rice, agriculture, Dawanau, Mile 12, Lagos, Kano',
  authors: [{ name: 'PriceNija' }],
  openGraph: {
    title: 'PriceNija - Nigerian Commodity Market Price Tracker',
    description: 'Real-time agricultural commodity prices across Nigeria\'s major markets',
    url: 'https://pricenija.com',
    siteName: 'PriceNija',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PriceNija - Nigerian Commodity Market Price Tracker',
    description: 'Real-time agricultural commodity prices across Nigeria\'s major markets',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
