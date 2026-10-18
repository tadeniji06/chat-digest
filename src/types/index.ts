export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max' | 'enterprise';

export interface PlanFeature {
  tier: SubscriptionTier;
  name: string;
  price: string;
  amount: number;
  currency: string;
  maxGroups: number;
  keywordsPerGroup: number;
  dailySummaries: number;
  isLifetimeSummary?: boolean;
  hasSummaries: boolean;
  hasWeeklyDigest: boolean;
  hasPastSearch: boolean;
  description: string;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanFeature> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: '₦0/mo',
    amount: 0,
    currency: 'NGN',
    maxGroups: 1,
    keywordsPerGroup: 2,
    dailySummaries: 1,
    isLifetimeSummary: true,
    hasSummaries: true,
    hasWeeklyDigest: false,
    hasPastSearch: false,
    description: '1 group monitoring, 2 keywords, and 1 AI summary forever.',
  },
  basic: {
    tier: 'basic',
    name: 'Basic',
    price: '₦2,000/mo',
    amount: 2000,
    currency: 'NGN',
    maxGroups: 3,
    keywordsPerGroup: 2,
    dailySummaries: 1,
    hasSummaries: true,
    hasWeeklyDigest: false,
    hasPastSearch: false,
    description: '3 groups monitoring, 2 keywords per group, 1 AI summary per day (resets every 24h).',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: '₦5,000/mo',
    amount: 5000,
    currency: 'NGN',
    maxGroups: 6,
    keywordsPerGroup: 3,
    dailySummaries: 3,
    hasSummaries: true,
    hasWeeklyDigest: false,
    hasPastSearch: false,
    description: '6 groups monitoring, 3 keywords per group, 3 AI summaries per day (resets every 24h).',
  },
  max: {
    tier: 'max',
    name: 'Max',
    price: '₦10,000/mo',
    amount: 10000,
    currency: 'NGN',
    maxGroups: 10,
    keywordsPerGroup: 4,
    dailySummaries: 5,
    hasSummaries: true,
    hasWeeklyDigest: true,
    hasPastSearch: true,
    description: '10 groups monitoring, 4 keywords per group, 5 AI summaries per day (resets every 24h).',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    price: '₦25,000/mo',
    amount: 25000,
    currency: 'NGN',
    maxGroups: 20,
    keywordsPerGroup: 10,
    dailySummaries: 10,
    hasSummaries: true,
    hasWeeklyDigest: true,
    hasPastSearch: true,
    description: '20 groups monitoring, 10 keywords per group, 10 AI summaries per day (resets every 24h).',
  },
};

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: SubscriptionTier;
  payment_status?: 'unpaid' | 'paid' | 'active' | 'cancelled';
  subscription_expires_at?: string;
  created_at: string;
}

export interface WhatsAppSession {
  id: string;
  user_id: string;
  session_name: string;
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'failed';
  phone_number?: string;
  push_name?: string;
  last_active?: string;
  created_at: string;
}

export interface MonitoredGroup {
  id: string;
  user_id: string;
  group_jid: string;
  group_name: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  group_jid: string;
  sender_jid: string;
  sender_name?: string;
  content: string;
  timestamp: string;
  processed: boolean;
  has_keyword_match?: boolean;
  matched_keywords?: string[];
  created_at: string;
}

export interface TopicDiscussed {
  topic: string;
  summary: string;
  contributors?: string[];
}

export interface SpeakerPoint {
  speaker: string;
  point: string;
}

export interface AISummary {
  id: string;
  user_id: string;
  group_jid: string;
  group_name?: string;
  summary_content: string;
  summary_period_start: string;
  summary_period_end: string;
  key_points?: string[];
  action_items?: string[];
  topics_discussed?: TopicDiscussed[];
  who_said_what?: SpeakerPoint[];
  highlighted_terms?: string[];
  message_count?: number;
  created_at: string;
}

export interface KeywordAlert {
  id: string;
  user_id: string;
  group_jid: string;
  group_name: string;
  sender_name: string;
  keyword: string;
  message_content: string;
  created_at: string;
}
