'use client';

import { Bell } from 'lucide-react';

export default function NotificationDropdown({ show }) {
  if (!show) return null;
  return (
    <div
      className="absolute right-0 top-12 w-72 sm:w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50"
      role="menu"
      aria-label="Notifications"
    >
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Notifications</h3>
      </div>
      <div className="p-4">
        <div className="text-center text-gray-400 py-4">
          <Bell size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No new notifications</p>
          <p className="text-xs mt-1">Price alerts will appear here</p>
        </div>
      </div>
      <div className="p-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Add items to your watchlist to receive price alerts
        </p>
      </div>
    </div>
  );
}
