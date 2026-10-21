'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application rendering error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-gray-900">
        <main className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-2xl font-bold">ChatDigest couldn&apos;t load this page</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            This may be temporary. Check your connection and try again, or return to the homepage.
          </p>
          {error.digest && (
            <p className="mt-3 break-all text-xs text-gray-400">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Go to homepage
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
