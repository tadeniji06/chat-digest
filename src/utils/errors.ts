/**
 * Maps raw backend or network error strings into user-friendly, non-technical explanations.
 */
export function getUserFriendlyError(err: unknown, defaultMessage = 'Something went wrong. Please try again.'): string {
  if (!err) return defaultMessage;

  const candidate =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? 'error' in err
            ? err.error
            : 'message' in err
              ? err.message
              : ''
          : '';
  const raw = typeof candidate === 'string' ? candidate : '';
  if (!raw || typeof raw !== 'string') return defaultMessage;

  const lower = raw.toLowerCase();

  // Network & Connectivity
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('connection refused') || lower.includes('econnrefused')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }

  // Auth & Credentials
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password. Please double-check and try again.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Your password must be at least 6 characters long.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email inbox and verify your address before signing in.';
  }
  if (lower.includes('auth_exchange_failed') || lower.includes('oauth')) {
    return 'Authentication could not be completed. Please try signing in again.';
  }

  // Database & Postgres constraints
  if (lower.includes('database error') || lower.includes('constraint') || lower.includes('duplicate key') || lower.includes('relation') || lower.includes('syntax error')) {
    return 'Unable to save your details right now. Please try again in a moment.';
  }

  // WhatsApp Bridge & Baileys
  if (lower.includes('connection closed') || lower.includes('stream errored') || lower.includes('401') || lower.includes('conflict')) {
    return 'WhatsApp connection timed out. Please click "Generate New Code" and enter it in WhatsApp.';
  }
  if (lower.includes('timed out') || lower.includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }
  if (lower.includes('phone number') || lower.includes('phone format')) {
    return 'Please enter a valid international phone number (e.g. +234...)';
  }

  // Flutterwave & Payments
  if (lower.includes('flutterwave') || lower.includes('gateway') || lower.includes('payment verification')) {
    return 'Payment gateway is momentarily busy. Please refresh or try again shortly.';
  }

  // AI provider availability, quota, and configuration
  if (lower.includes('no messages recorded') || lower.includes('no messages found')) {
    return 'No messages were found for this group and time period. Check that WhatsApp is connected and saving messages, or choose a longer timeframe.';
  }
  if (
    (lower.includes('api credits') || lower.includes('billing is not active')) &&
    (lower.includes('grok') || lower.includes('xai') || lower.includes('x.ai'))
  ) {
    return 'Summary generation needs active xAI API billing or API credits. Add credits in the xAI developer console; a Grok Plus subscription does not cover API usage.';
  }
  if (
    lower.includes('quota') &&
    (lower.includes('used up') ||
      lower.includes('exhausted') ||
      lower.includes('budget') ||
      lower.includes('reset'))
  ) {
    return 'The Grok API quota for this key has been used up. Please try again after the quota resets.';
  }
  if (
    lower.includes('resource exhausted') ||
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('http 429') ||
    lower.includes('status 429')
  ) {
    return 'The AI provider is rate-limiting requests. Please wait a minute and try again.';
  }
  if (
    lower.includes('temporarily unavailable') ||
    lower.includes('overloaded') ||
    lower.includes('http 503') ||
    lower.includes('status 503')
  ) {
    return 'The AI service is temporarily unavailable. Please try again in a minute.';
  }
  if (
    lower.includes('api key') ||
    lower.includes('permission denied') ||
    lower.includes('unauthorized') ||
    lower.includes('http 403') ||
    lower.includes('http 401')
  ) {
    return 'The AI service configuration needs attention. Please contact support.';
  }
  if (lower.includes('grok') || lower.includes('model')) {
    return 'The AI service could not complete this summary. Please try again; if it keeps happening, contact support.';
  }

  // If already a clean user-facing sentence (does not look like code/SQL/trace)
  if (!/[_{}\[\]\(\)<>=:;\\\/]|error code|exception|at \w+/i.test(raw) && raw.length < 150) {
    return raw;
  }

  return defaultMessage;
}
