'use client';

export default function ManageCookiesButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-cookie-banner'));
        }
      }}
      className="font-semibold text-emerald-700 underline hover:text-emerald-800"
    >
      Manage Cookie Preferences
    </button>
  );
}
