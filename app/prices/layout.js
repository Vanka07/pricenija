export const metadata = {
  title: 'Commodity Prices',
  description: 'Compare commodity prices as of the newest stored date across Nigerian markets. Find the cheapest prices for rice, maize, beans, yam, and more.',
  alternates: {
    canonical: 'https://www.pricenija.com/prices',
  },
  openGraph: {
    title: 'Commodity Prices - PriceNija',
    description: 'Compare commodity prices as of the newest stored date across Nigerian markets. Find the cheapest prices for rice, maize, beans, yam, and more.',
    url: 'https://www.pricenija.com/prices',
  },
};

export default function PricesLayout({ children }) {
  return children;
}
