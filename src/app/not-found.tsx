import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home, MessageSquare, AlertCircle, Compass } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Header with Logo */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="ChatDigest Logo"
              width={160}
              height={42}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>
          <Link
            href="/dashboard"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-xl w-full text-center space-y-8">
          {/* Visual Glitch / Badge */}
          <div className="relative inline-block">
            <div className="text-8xl sm:text-9xl font-black text-gray-200 tracking-tight select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="p-4 rounded-2xl bg-white shadow-xl border border-gray-200 text-emerald-600">
                <Compass className="w-12 h-12 animate-pulse" />
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Oops! Page Not Found
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find the page you were looking for. It might have been moved, renamed, or is temporarily unavailable.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
              <span>Return to Dashboard</span>
            </Link>
          </div>

          {/* Quick Helpful Navigation Links */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
              Popular Destinations
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-emerald-700">
              <Link href="/subscribe" className="hover:underline">Pricing Plans</Link>
              <span className="text-gray-300">•</span>
              <Link href="/dashboard/connect" className="hover:underline">WhatsApp Connect</Link>
              <span className="text-gray-300">•</span>
              <Link href="/dashboard/summaries" className="hover:underline">AI Digests</Link>
              <span className="text-gray-300">•</span>
              <Link href="/terms" className="hover:underline">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} ChatDigest Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
