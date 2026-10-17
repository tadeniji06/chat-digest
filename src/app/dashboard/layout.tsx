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

  if (cookieSub) {
    const [cUserId, cTier, cStatus] = cookieSub.split(':');
    if (cUserId === user.id && (cStatus === 'active' || cStatus === 'paid')) {
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

  const tier = (userProfile?.subscription_tier || cookieTier || metadataTier || 'none') as SubscriptionTier;
  const paymentStatus = userProfile?.payment_status || (cookiePaid ? 'active' : null) || metadataPayment || 'unpaid';

  // Strict payment gate: If user has no active plan or payment status is not active/paid, redirect to subscribe
  const isPaid = paymentStatus === 'active' || paymentStatus === 'paid';
  const hasPlan = tier !== 'none';

  if (!hasPlan || !isPaid) {
    redirect('/subscribe');
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900">
      <Sidebar userEmail={user.email || 'User'} tier={tier} />
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
