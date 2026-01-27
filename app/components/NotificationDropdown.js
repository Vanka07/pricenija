'use client';

import { Bell, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function NotificationDropdown({ show, topGainers = [], topLosers = [] }) {
  if (!show) return null;

  const hasAlerts = topGainers.length > 0 || topLosers.length > 0;

  return (
    <div
      className="absolute right-0 top-12 w-72 sm:w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50"
      role="menu"
      aria-label="Notifications"
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-white">Notifications</h3>
        {hasAlerts && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
            {topGainers.length + topLosers.length} updates
          </span>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {hasAlerts ? (
          <div className="divide-y divide-gray-800">
            {topGainers.slice(0, 3).map((item) => (
              <div key={item.commodity.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={16} className="text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{item.commodity.name}</p>
                  <p className="text-xs text-green-400">+{item.change.toFixed(1)}% price increase</p>
                </div>
              </div>
            ))}
            {topLosers.slice(0, 3).map((item) => (
              <div key={item.commodity.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingDown size={16} className="text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{item.commodity.name}</p>
                  <p className="text-xs text-red-400">{item.change.toFixed(1)}% price drop</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400 py-6">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No price changes today</p>
            <p className="text-xs mt-1">Price alerts will appear here</p>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          <BarChart3 size={12} /> Showing latest price movements
        </p>
      </div>
    </div>
  );
}
