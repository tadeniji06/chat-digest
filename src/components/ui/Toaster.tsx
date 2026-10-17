'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'bg-white text-gray-900 border border-gray-200 shadow-md rounded-xl p-4 flex items-center gap-3 text-sm font-sans',
          title: 'font-semibold text-gray-900 text-sm',
          description: 'text-xs text-gray-600',
          actionButton:
            'bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
          cancelButton:
            'bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
          success: 'text-emerald-700 border-emerald-200 bg-emerald-50/50',
          error: 'text-red-700 border-red-200 bg-red-50/50',
          warning: 'text-gray-800 border-gray-200 bg-gray-50/50',
          info: 'text-gray-800 border-gray-200 bg-gray-50/50',
        },
      }}
    />
  );
}
