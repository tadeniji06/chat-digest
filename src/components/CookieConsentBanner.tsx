'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Check, ShieldCheck } from 'lucide-react';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('chatdigest_cookie_consent');
    if (!consent) {
      // Delay showing banner slightly for smooth UX
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }

    // Allow user to reopen banner from footer
    const handleReopen = () => {
      setVisible(true);
      setPreferencesOpen(true);
    };
    window.addEventListener('open-cookie-banner', handleReopen);
    return () => window.removeEventListener('open-cookie-banner', handleReopen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      'chatdigest_cookie_consent',
      JSON.stringify({ necessary: true, analytics: true, timestamp: new Date().toISOString() })
    );
    setVisible(false);
  };

  const handleNecessaryOnly = () => {
    localStorage.setItem(
      'chatdigest_cookie_consent',
      JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString() })
    );
    setVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem(
      'chatdigest_cookie_consent',
      JSON.stringify({ necessary: true, analytics: analyticsAllowed, timestamp: new Date().toISOString() })
    );
    setVisible(false);
    setPreferencesOpen(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 md:p-6 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-2xl p-5 sm:p-6 pointer-events-auto text-gray-800">
        {!preferencesOpen ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-100">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  We respect your privacy &amp; cookies
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                  ChatDigest uses essential cookies to keep your authentication session active and secure. We also use privacy-friendly analytics to improve group summarization performance. We never sell your personal information or read encrypted message content. Learn more in our{' '}
                  <Link href="/cookies" className="text-emerald-700 font-semibold underline hover:text-emerald-800">
                    Cookie Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-emerald-700 font-semibold underline hover:text-emerald-800">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setPreferencesOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-center"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleNecessaryOnly}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors text-center"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Accept All
              </button>
            </div>
          </div>
        ) : (
          /* Preferences Modal State inside banner */
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-gray-900">
                  Cookie &amp; Tracking Preferences
                </h4>
              </div>
              <button
                onClick={() => setPreferencesOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Strictly Necessary Cookies</span>
                    <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                      Required
                    </span>
                  </div>
                  <p className="text-gray-500 leading-relaxed">
                    Essential for secure authentication, session management, CSRF defense, and subscription tier persistence. Cannot be disabled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-1 cursor-not-allowed"
                />
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-gray-900">
                    Performance &amp; Diagnostics Cookies
                  </div>
                  <p className="text-gray-500 leading-relaxed">
                    Helps us monitor AI generation latency, summarize endpoint health, and catch client-side errors to improve app responsiveness.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsAllowed}
                  onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPreferencesOpen(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
