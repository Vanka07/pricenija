'use client';

import { useState } from 'react';
import {
  Bell, LogIn, LogOut, Menu, X, Home, BarChart3, MapPin, Star,
  RefreshCw, Twitter, Facebook, Instagram, Mail, Shield, FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Logo from './Logo';
import AuthModal from './AuthModal';
import NotificationDropdown from './NotificationDropdown';
import BottomNav from './BottomNav';
import { ToastProvider } from './Toast';

const navItems = [
  { id: 'dashboard', href: '/', label: 'Dashboard', icon: Home },
  { id: 'prices', href: '/prices', label: 'Prices', icon: BarChart3 },
  { id: 'markets', href: '/markets', label: 'Markets', icon: MapPin },
  { id: 'watchlist', href: '/watchlist', label: 'Watchlist', icon: Star },
];

function getActiveTab(pathname) {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/prices')) return 'prices';
  if (pathname.startsWith('/markets')) return 'markets';
  if (pathname.startsWith('/watchlist')) return 'watchlist';
  return 'dashboard';
}

function PageShellInner({
  children,
  user,
  topGainers = [],
  topLosers = [],
  lastUpdated,
  refreshing,
  onRefresh,
  showAuthModal,
  setShowAuthModal,
}) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Custom animation styles */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        .hover\\:bg-gray-750:hover {
          background-color: rgb(38, 42, 51);
        }
        .tab-content {
          animation: tab-fade-in 0.3s ease-out;
        }
        @keyframes tab-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-green-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to main content
      </a>

      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        authMode={authMode}
        setAuthMode={setAuthMode}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800" role="banner">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="hidden sm:block"><Logo size="md" /></div>
              <div className="sm:hidden"><Logo size="sm" /></div>
              <div>
                <span className="text-lg sm:text-xl font-bold">Price<span className="text-green-400">Nija</span></span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">Track • Compare • Save</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navItems.map(({ id, href, label, icon: Icon }) => (
                <Link key={id} href={href}
                  className={`px-3 lg:px-4 py-2 rounded-lg font-medium transition capitalize flex items-center gap-2
                    ${activeTab === id ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <Icon size={18} />
                  {label.toLowerCase()}
                </Link>
              ))}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative">
                <button className="relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications">
                  <Bell size={20} />
                  {(topGainers.length > 0 || topLosers.length > 0) && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                      {topGainers.length + topLosers.length}
                    </span>
                  )}
                </button>
                <NotificationDropdown show={showNotifications} topGainers={topGainers} topLosers={topLosers} />
              </div>

              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline text-sm text-gray-400">{user.email?.split('@')[0]}</span>
                  <button onClick={async () => { await supabase.auth.signOut(); }}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white" title="Sign out" aria-label="Sign out">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1 sm:gap-2 bg-green-500 hover:bg-green-600 px-2 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base">
                  <LogIn size={18} /><span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-2 px-3 sm:px-4">
            {navItems.map(({ id, href, label, icon: Icon }) => (
              <Link key={id} href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium capitalize flex items-center gap-3
                  ${activeTab === id ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}>
                <Icon size={18} />
                {label.toLowerCase()}
              </Link>
            ))}
          </div>
        )}
      </header>

      {showNotifications && <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />}

      {/* Status Bar */}
      <div className="bg-gray-900 border-b border-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400">Live</span>
            </span>
            <span className="text-gray-500">
              Last updated: {lastUpdated?.toLocaleString('en-NG', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) || 'Loading...'}
            </span>
          </div>
          <button onClick={onRefresh} disabled={refreshing}
            className="flex items-center gap-1 text-green-400 hover:text-green-300 disabled:opacity-50"
            aria-label="Refresh data">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-8 sm:mt-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <p className="text-gray-400 text-sm mb-4">
                Nigeria&apos;s leading agricultural commodity price tracker. Real-time market intelligence for smarter decisions.
              </p>
              <div className="flex gap-3">
                <span className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 cursor-default" aria-label="Twitter">
                  <Twitter size={18} />
                </span>
                <span className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 cursor-default" aria-label="Facebook">
                  <Facebook size={18} />
                </span>
                <span className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 cursor-default" aria-label="Instagram">
                  <Instagram size={18} />
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-400 hover:text-green-400 transition">Dashboard</Link></li>
                <li><Link href="/prices" className="text-gray-400 hover:text-green-400 transition">Prices</Link></li>
                <li><Link href="/markets" className="text-gray-400 hover:text-green-400 transition">Markets</Link></li>
                <li><Link href="/watchlist" className="text-gray-400 hover:text-green-400 transition">Watchlist</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-green-400 transition">About Us</Link></li>
                <li><Link href="/about#faq" className="text-gray-400 hover:text-green-400 transition">FAQ</Link></li>
                <li><Link href="/about#how-it-works" className="text-gray-400 hover:text-green-400 transition">How It Works</Link></li>
                <li><Link href="/about#contact" className="text-gray-400 hover:text-green-400 transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:support@pricenija.com" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2">
                    <Mail size={14} /> support@pricenija.com
                  </a>
                </li>
              </ul>
              <h4 className="font-semibold text-white mb-3 mt-6">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-500 flex items-center gap-2"><Shield size={14} /> Privacy Policy</span></li>
                <li><span className="text-gray-500 flex items-center gap-2"><FileText size={14} /> Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs sm:text-sm">
              © {new Date().getFullYear()} PriceNija. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Made with 💚 for Nigerian farmers and traders
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} useLinks />
    </div>
  );
}

export default function PageShell(props) {
  return (
    <ToastProvider>
      <PageShellInner {...props} />
    </ToastProvider>
  );
}
