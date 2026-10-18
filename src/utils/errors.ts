/**
 * Maps raw backend or network error strings into user-friendly, non-technical explanations.
 */
export function getUserFriendlyError(err: unknown, defaultMessage = 'Something went wrong. Please try again.'): string {
  if (!err) return defaultMessage;

  const raw = typeof err === 'string' ? err : err instanceof Error ? err.message : (err as any)?.error || (err as any)?.message || '';
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

  // AI & Gemini
  if (lower.includes('gemini') || lower.includes('quota') || lower.includes('model') || lower.includes('resource exhausted')) {
    return 'AI digest generation is currently in high demand. Please try again in a few moments.';
  }

  // If already a clean user-facing sentence (does not look like code/SQL/trace)
  if (!/[_{}\[\]\(\)<>=:;\\\/]|error code|exception|at \w+/i.test(raw) && raw.length < 150) {
    return raw;
  }

  return defaultMessage;
}
