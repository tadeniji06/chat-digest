'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  Users2,
  FileText,
  Bell,
  CreditCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { SubscriptionTier, PLAN_LIMITS } from '@/types';

interface SidebarProps {
  userEmail: string;
  tier: SubscriptionTier;
}

export function Sidebar({ userEmail, tier }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'WhatsApp Connection', href: '/dashboard/connect', icon: QrCode },
    { name: 'Monitored Groups', href: '/dashboard/groups', icon: Users2 },
    { name: 'AI Summaries', href: '/dashboard/summaries', icon: FileText },
    { name: 'Keyword Alerts', href: '/dashboard/alerts', icon: Bell },
    { name: 'Subscription & Plans', href: '/dashboard/subscription', icon: CreditCard },
  ];

  const currentPlan = tier === 'none' ? PLAN_LIMITS.base : PLAN_LIMITS[tier];

  const navContent = (
    <>
      {/* Brand header with prominent logo */}
      <div className="p-6 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center" onClick={() => setMobileOpen(false)}>
            <Image
              src="/logo.png"
              alt="ChatDigest Logo"
              width={180}
              height={48}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">
          Connect & Manage WhatsApp
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Plan summary badge card */}
      <div className="p-4 mx-3 mb-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-gray-900">
            {currentPlan.name} Plan
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800">
            {tier}
          </span>
        </div>
        <p className="text-gray-500 text-[11px] leading-relaxed mb-2.5">
          {currentPlan.maxGroups} group(s) &bull;{' '}
          {currentPlan.hasSummaries ? 'AI Summaries' : 'Keyword alerts'}
        </p>
        <Link
          href="/dashboard/subscription"
          onClick={() => setMobileOpen(false)}
          className="inline-block text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Change Plan &rarr;
        </Link>
      </div>

      {/* User profile & sign out */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
        <div className="overflow-hidden pr-2">
          <p className="text-xs font-semibold text-gray-900 truncate">{userEmail}</p>
          <span className="text-[11px] text-gray-500">Active Account</span>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="ChatDigest Logo"
            width={140}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>
    </>
  );
}
