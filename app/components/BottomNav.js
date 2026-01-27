'use client';

import { Home, BarChart3, MapPin, Star } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'prices', label: 'Prices', icon: BarChart3 },
  { id: 'markets', label: 'Markets', icon: MapPin },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[64px] transition-colors ${
              activeTab === id ? 'text-green-400' : 'text-gray-500'
            }`}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
