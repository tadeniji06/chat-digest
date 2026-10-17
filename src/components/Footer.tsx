'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, Bell, Sparkles, Mail, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info (Full Width on mobile, 2 cols on lg) */}
          <div className="sm:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="ChatDigest Logo"
                width={170}
                height={44}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-sm">
              ChatDigest transforms overwhelming WhatsApp group chatter into actionable 60-second meeting minutes, executive digests, and real-time keyword alert notifications.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <Shield className="w-3.5 h-3.5" /> End-to-end encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <Lock className="w-3.5 h-3.5" /> Zero persistent chat logs
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Product &amp; Features
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/#features" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> AI Group Summaries
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-emerald-600" /> Keyword Alerts
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-emerald-600 transition-colors">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                  Web Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/connect" className="hover:text-emerald-600 transition-colors">
                  WhatsApp Connection
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Legal &amp; Trust
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-emerald-600 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <a
                  href="#cookie-preferences"
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-cookie-banner'));
                    }
                  }}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Manage Cookie Preferences
                </a>
              </li>
            </ul>
          </div>

          {/* Audience & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Community &amp; Help
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="text-gray-500">
                Built for Students, Cohorts &amp; Community Managers
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-600 transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-emerald-600 transition-colors">
                  Get Started Free
                </Link>
              </li>
              <li className="pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Web Protocol
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} ChatDigest. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-emerald-600 transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-emerald-600 transition-colors">
              Cookies
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">
              Not affiliated with or endorsed by Meta / WhatsApp LLC.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
