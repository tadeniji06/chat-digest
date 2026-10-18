import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SubscriptionTier } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Check direct fallback cookie
  const cookieStore = await cookies();
  const cookieSub = cookieStore.get('cd_sub_active')?.value;
  let cookieTier: SubscriptionTier | null = null;
  let cookiePaid = false;

  const validTiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'max', 'enterprise'];

  if (cookieSub) {
    const [cUserId, cTier, cStatus] = cookieSub.split(':');
    if (cUserId === user.id && validTiers.includes(cTier as SubscriptionTier) && (cStatus === 'active' || cStatus === 'paid')) {
      cookiePaid = true;
      cookieTier = cTier as SubscriptionTier;
    }
  }

  // 2. Check public.users table (if schema executed)
  const { data: userProfile } = await supabase
    .from('users')
    .select('subscription_tier, payment_status, subscription_expires_at')
    .eq('id', user.id)
    .maybeSingle();

  // 3. Check user.user_metadata
  const metadataTier = user.user_metadata?.subscription_tier;
  const metadataPayment = user.user_metadata?.payment_status;
  const metadataExpiresAt = user.user_metadata?.subscription_expires_at;

  const rawTier = (userProfile?.subscription_tier || metadataTier || cookieTier || 'free') as SubscriptionTier;
  const paymentStatus = userProfile?.payment_status || metadataPayment || (cookiePaid ? 'active' : null) || (rawTier === 'free' ? 'active' : 'unpaid');
  const expiresAt = userProfile?.subscription_expires_at || metadataExpiresAt || null;

  // Check 30-day expiration for paid subscriptions
  let isExpired = false;
  if (rawTier !== 'free' && expiresAt) {
    const expTime = new Date(expiresAt).getTime();
    if (Date.now() > expTime) {
      isExpired = true;
    }
  }

  const isPaid = (paymentStatus === 'active' || paymentStatus === 'paid') && !isExpired;
  // If paid tier expired, fall back to free tier or redirect if on paid gating
  const activeTier: SubscriptionTier = isExpired ? 'free' : rawTier;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900">
      <Sidebar userEmail={user.email || 'User'} tier={activeTier} isExpired={isExpired} expiresAt={expiresAt} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Safety advisory banner */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 sm:px-6 py-2.5 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded shrink-0">
              Notice
            </span>
            <span className="font-medium text-emerald-900">
              ChatDigest connects via WhatsApp Web session protocol. Use responsibly to ensure compliance with WhatsApp Terms of Service.
            </span>
          </div>
          <span className="hidden lg:inline text-emerald-700 text-[11px] font-semibold shrink-0">
            End-to-end encrypted session
          </span>
        </div>
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
