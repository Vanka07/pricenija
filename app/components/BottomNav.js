'use client';

import { Home, BarChart3, MapPin, Star } from 'lucide-react';
import Link from 'next/link';

const tabs = [
  { id: 'dashboard', label: 'Home', icon: Home, href: '/' },
  { id: 'prices', label: 'Prices', icon: BarChart3, href: '/prices' },
  { id: 'markets', label: 'Markets', icon: MapPin, href: '/markets' },
  { id: 'watchlist', label: 'Watchlist', icon: Star, href: '/watchlist' },
];

export default function BottomNav({ activeTab, onTabChange, useLinks = false }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ id, label, icon: Icon, href }) => {
          const isActive = activeTab === id;
          const className = `flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[64px] transition-colors ${
            isActive ? 'text-green-400' : 'text-gray-500'
          }`;

          if (useLinks) {
            return (
              <Link
                key={id}
                href={href}
                className={className}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          }

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={className}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
