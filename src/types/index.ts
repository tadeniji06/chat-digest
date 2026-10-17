export type SubscriptionTier = 'none' | 'base' | 'pro' | 'max';

export interface PlanFeature {
  tier: 'base' | 'pro' | 'max';
  name: string;
  price: string;
  amount: number;
  currency: string;
  maxGroups: number;
  hasSummaries: boolean;
  hasWeeklyDigest: boolean;
  hasPastSearch: boolean;
  keywordsLimit: number;
  description: string;
}

export const PLAN_LIMITS: Record<'base' | 'pro' | 'max', PlanFeature> = {
  base: {
    tier: 'base',
    name: 'Base',
    price: '₦1,500/mo',
    amount: 1500,
    currency: 'NGN',
    maxGroups: 1,
    hasSummaries: false,
    hasWeeklyDigest: false,
    hasPastSearch: false,
    keywordsLimit: 5,
    description: '1 WhatsApp group monitoring & instant real-time keyword alerts.',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: '₦5,000/mo',
    amount: 5000,
    currency: 'NGN',
    maxGroups: 3,
    hasSummaries: true,
    hasWeeklyDigest: false,
    hasPastSearch: false,
    keywordsLimit: 15,
    description: '3 groups, keyword alerts + Daily AI-powered bullet summaries.',
  },
  max: {
    tier: 'max',
    name: 'Max',
    price: '₦10,000/mo',
    amount: 10000,
    currency: 'NGN',
    maxGroups: 10,
    hasSummaries: true,
    hasWeeklyDigest: true,
    hasPastSearch: true,
    keywordsLimit: 50,
    description: '10 groups, keyword alerts, AI summaries, weekly digest & past archive search.',
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
