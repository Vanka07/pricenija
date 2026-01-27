'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, TrendingUp, MapPin, Bell, Shield, Users,
    BarChart3, Clock, CheckCircle, ChevronRight, Mail,
    Twitter, Facebook, Instagram
} from 'lucide-react';

// Logo Component
const Logo = ({ size = 'md' }) => {
    const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
    return (
          <div className={`${sizes[size]} bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg`}>
        <span className="text-white font-bold text-sm">PN</span>
  </div>
  );
};

export default function AboutPage() {
    const [activeSection, setActiveSection] = useState('about');

  // Sync activeSection with scroll position so the nav tabs highlight correctly
  useEffect(() => {
    const sectionIds = ['contact', 'faq', 'how-it-works', 'about'];
    const handleScroll = () => {
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
            icon: <TrendingUp className="text-green-400" size={28} />,
            title: 'Real-Time Prices',
            description: 'Get up-to-date commodity prices from major Nigerian markets, updated regularly to help you make informed decisions.'
    },
    {
            icon: <MapPin className="text-blue-400" size={28} />,
            title: '5+ Major Markets',
            description: 'Compare prices across Dawanau, Mile 12, Bodija, Wuse, and other top Nigerian commodity markets.'
    },
    {
            icon: <Bell className="text-yellow-400" size={28} />,
            title: 'Price Tracking',
            description: 'Add commodities to your watchlist and track price changes over time with our intuitive dashboard.'
    },
    {
            icon: <BarChart3 className="text-purple-400" size={28} />,
            title: 'Price Analytics',
            description: 'View price trends, volatility indicators, and historical data to spot the best buying opportunities.'
    }
      ];

    const howItWorks = [
      {
              step: 1,
              title: 'Browse Commodities',
              description: 'Explore our database of 18+ agricultural commodities including grains, legumes, tubers, and vegetables.'
      },
      {
              step: 2,
              title: 'Compare Prices',
              description: 'See prices from different markets side by side. Find the lowest prices and potential savings.'
      },
      {
              step: 3,
              title: 'Track Favorites',
              description: 'Create a free account to add items to your watchlist and get personalized price tracking.'
      },
      {
              step: 4,
              title: 'Make Smart Decisions',
              description: 'Use our insights to decide when and where to buy for the best value.'
      }
        ];

  const faqs = [
    {
            question: 'How often are prices updated?',
            answer: 'Prices are updated regularly based on market data. The "Last updated" timestamp on the dashboard shows when data was last refreshed.'
    },
    {
            question: 'Which markets do you cover?',
            answer: 'We currently cover major Nigerian markets including Dawanau (Kano), Mile 12 (Lagos), Bodija (Ibadan), Wuse (Abuja), and Ogbete Main (Enugu).'
    },
    {
            question: 'Is PriceNija free to use?',
            answer: 'Yes! PriceNija is completely free. Create an account to unlock features like watchlists and personalized tracking.'
    },
    {
            question: 'How accurate are the prices?',
            answer: 'We source data from reliable market sources. Prices shown are averages and may vary slightly from actual market prices on any given day.'
    },
    {
            question: 'Can I contribute price data?',
            answer: 'We are working on features to allow verified contributors to submit price updates. Contact us if you are interested!'
    }
      ];

        return (
              <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
                <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
                  <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                        <Logo size="sm" />
                        <span className="text-xl font-bold">Price<span className="text-green-400">Nija</span></span>
          </Link>
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
                        <ArrowLeft size={18} />
                        Back to Dashboard
          </Link>
          </div>
          </div>
          </header>

  {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 sm:py-24">
                  <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                      Track Agricultural Prices <span className="text-green-400">Across Nigeria</span>
          </h1>
            <p className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto mb-8">
                      PriceNija helps farmers, traders, and consumers make smarter buying decisions
              by providing real-time commodity price data from Nigeria&apos;s top markets.
                </p>
            <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2">
                              Explore Prices <ChevronRight size={20} />
                </Link>
              <a href="#how-it-works" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition">
                              Learn How It Works
                </a>
                </div>
                </div>
                </section>

  {/* Navigation Tabs */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-[73px] z-40">
                  <div className="max-w-6xl mx-auto px-4">
                    <nav className="flex gap-1 overflow-x-auto py-2">
        {[
        { id: 'about', label: 'About' },
        { id: 'how-it-works', label: 'How It Works' },
        { id: 'faq', label: 'FAQ' },
        { id: 'contact', label: 'Contact' }
                      ].map((tab) => (
                        <a key={tab.id} href={`#${tab.id}`} onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                                    activeSection === tab.id ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
{tab.label}
</a>
            ))}
              </nav>
              </div>
              </div>

{/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
      {/* About Section */}
        <section id="about" className="mb-20">
                  <h2 className="text-3xl font-bold mb-4">About PriceNija</h2>
          <p className="text-gray-400 mb-8 max-w-3xl">
                    PriceNija is Nigeria&apos;s leading agricultural commodity price tracker. We aggregate
            price data from major markets across the country to help you find the best deals
            and understand market trends.
              </p>

{/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
                          <div key={index} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition">
                            <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
            {feature.icon}
            </div>
                                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                        <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
                                    ))}
</div>

{/* Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
          { value: '18+', label: 'Commodities' },
          { value: '5+', label: 'Markets' },
          { value: 'Live', label: 'Price Updates' },
          { value: 'Free', label: 'To Use' }
                        ].map((stat, index) => (
                          <div key={index} className="text-center">
                            <p className="text-3xl sm:text-4xl font-bold text-green-400">{stat.value}</p>
                                              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
                                          ))}
</div>
  </section>

{/* How It Works Section */}
        <section id="how-it-works" className="mb-20">
                    <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 mb-8 max-w-3xl">
                      Getting started with PriceNija is easy. Follow these simple steps to start tracking commodity prices.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {howItWorks.map((item) => (
                        <div key={item.step} className="relative">
                          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-full">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
          {item.step}
          </div>
                                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                          <p className="text-gray-400 text-sm">{item.description}</p>
          </div>
                        {item.step < 4 && (
                            <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                              <ChevronRight className="text-gray-700" size={24} />
          </div>
                                         )}
</div>
            ))}
              </div>
              </section>

{/* FAQ Section */}
        <section id="faq" className="mb-20">
                    <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-400 mb-8 max-w-3xl">
                      Got questions? We&apos;ve got answers. If you can&apos;t find what you&apos;re looking for, feel free to contact us.
          </p>

          <div className="space-y-4 max-w-3xl">
        {faqs.map((faq, index) => (
                        <div key={index} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                          <h3 className="font-semibold text-lg mb-2 flex items-start gap-3">
                            <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
          {faq.question}
                  </h3>
                                  <p className="text-gray-400 ml-8">{faq.answer}</p>
                  </div>
                              ))}
</div>
  </section>

{/* Contact Section */}
        <section id="contact" className="mb-20">
                    <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-400 mb-8 max-w-3xl">
                      Have questions, feedback, or suggestions? We&apos;d love to hear from you!
          </p>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
                      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                        <h3 className="font-semibold text-lg mb-4">Get in Touch</h3>
              <div className="space-y-4">
                          <a href="mailto:support@pricenija.com" className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition">
                            <Mail size={20} />
                            support@pricenija.com
          </a>
                <div className="pt-4 border-t border-gray-800">
                            <p className="text-gray-500 text-sm mb-3">Follow us (coming soon)</p>
                  <div className="flex gap-3">
                              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                                <Twitter size={20} />
          </div>
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                                <Facebook size={20} />
          </div>
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                                <Instagram size={20} />
          </div>
          </div>
          </div>
          </div>
          </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                        <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <div className="space-y-3">
                          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition">
                            <ChevronRight size={16} /> Dashboard
          </Link>
                <Link href="/#prices" className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition">
                            <ChevronRight size={16} /> View Prices
          </Link>
                <Link href="/#markets" className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition">
                            <ChevronRight size={16} /> Explore Markets
          </Link>
                <Link href="/#watchlist" className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition">
                            <ChevronRight size={16} /> My Watchlist
          </Link>
          </div>
          </div>
          </div>
          </section>
          </main>

{/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
                <div className="max-w-6xl mx-auto px-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Logo size="sm" />
                    <span className="font-bold text-lg">PriceNija</span>
        </div>
          <p className="text-gray-500 text-sm mb-4">Nigeria&apos;s leading agricultural commodity price tracker.</p>
          <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} PriceNija. All rights reserved.</p>
        </div>
        </footer>
        </div>
  );
}
