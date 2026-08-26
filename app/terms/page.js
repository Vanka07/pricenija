'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import Logo from '../components/Logo';

export default function TermsPage() {
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
          <FileText className="text-green-400" size={28} />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">Last updated: 26 August 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What PriceNija is</h2>
            <p>
              PriceNija is a free website that shows agricultural commodity prices stored from Nigerian markets.
              These terms are written by the site operators. They are not a law-firm contract and are not legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Prices are as of the newest stored date</h2>
            <p>
              Figures on the site come from records we have already stored. They are not a live feed from every stall
              and may be incomplete, delayed, or wrong. Always treat the status bar date as the as-of date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">No trading or buying advice</h2>
            <p>
              PriceNija does not sell commodities, execute trades, or tell you where you must buy.
              Use the numbers as a starting point and confirm locally before you spend money.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Accounts</h2>
            <p>
              An account is optional. If you create one, keep your password private and use the site lawfully.
              We may disable an account that is abused or used to attack the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Availability</h2>
            <p>
              We try to keep the site up, but we do not promise uninterrupted access or that every market will have
              a price every day.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              Questions about these terms: {' '}
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
