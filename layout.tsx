import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PriceNija - Nigerian Commodity Market Price Tracker',
  description: 'Real-time agricultural commodity prices across Nigeria\'s major markets. Track beans, maize, rice, and more.',
  keywords: 'Nigeria, commodity prices, agricultural prices, beans price, maize price, rice price, Dawanau market, Mile 12 market',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
