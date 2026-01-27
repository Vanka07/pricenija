import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-green-400 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          <Link
            href="/about"
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <Search size={18} />
            About PriceNija
          </Link>
        </div>
      </div>
    </div>
  );
}
