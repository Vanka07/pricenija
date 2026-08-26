'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import Logo from '../components/Logo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <Logo size="sm" />
            <span className="text-xl font-bold">Price<span className="text-green-400">Nija</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-green-400" size={28} />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">Last updated: 26 August 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Who we are</h2>
            <p>
              PriceNija is a small web app that shows agricultural commodity prices from Nigerian markets.
              This page explains what information the site uses. It is not a law-firm policy and is not legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                If you create an account, we store the email and password you submit through Supabase Auth
                so you can sign in again.
              </li>
              <li>
                If you use a watchlist or price alerts, we store those choices against your account.
              </li>
              <li>
                The public site also loads market, commodity, and price records so anyone can browse them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What we do not do</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not sell your account information.</li>
              <li>We do not require an account to view stored prices.</li>
              <li>We do not claim to collect prices from your device in the background.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How long data stays</h2>
            <p>
              Account, watchlist, and alert data stay until you delete them or ask us to remove them.
              Price records are historical market data kept so the tracker can show the newest date on record.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              Questions about this policy: {' '}
              <a href="mailto:support@pricenija.com" className="text-green-400 hover:underline">
                support@pricenija.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500 space-y-2">
          <p>
            <Link href="/privacy" className="hover:text-green-400">Privacy Policy</Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:text-green-400">Terms of Service</Link>
          </p>
          <p>&copy; {new Date().getFullYear()} PriceNija</p>
        </div>
      </footer>
    </div>
  );
}
