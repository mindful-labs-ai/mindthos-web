type FbqArgs = unknown[];

declare global {
  interface Window {
    fbq?: ((...args: FbqArgs) => void) & { queue?: unknown[] };
  }
}

export const META_PIXEL_ID = '2508548632910576';

export interface MetaAdvancedMatching {
  email?: string;
  /** E.164 format (e.g. +821012345678) */
  phone?: string;
  externalId?: string;
}

export interface MetaTrackOptions {
  /** For server-side Conversions API deduplication. */
  eventId?: string;
}

/**
 * Convert a Korean phone number (e.g. "010-1234-5678" / "01012345678")
 * to E.164 format ("+821012345678") for Meta Advanced Matching.
 * Returns undefined if the input cannot be normalized.
 */
export const toE164KR = (
  phone: string | null | undefined
): string | undefined => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return undefined;
  if (digits.startsWith('82')) return `+${digits}`;
  if (digits.startsWith('0')) return `+82${digits.slice(1)}`;
  return `+82${digits}`;
};

/**
 * Re-initialize Meta Pixel with user data for Advanced Matching.
 * Improves attribution match-rate under iOS ATT / 3rd-party cookie loss.
 * Meta SDK hashes PII (em/ph) client-side before sending.
 */
export const identifyFBUser = (data: MetaAdvancedMatching) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }
  const userData: Record<string, string> = {};
  if (data.email) userData.em = data.email.trim().toLowerCase();
  if (data.phone) userData.ph = data.phone;
  if (data.externalId) userData.external_id = data.externalId;
  if (Object.keys(userData).length === 0) return;
  window.fbq('init', META_PIXEL_ID, userData);
};

/**
 * Fire a Meta Pixel track event. If `eventId` is provided, it will be
 * forwarded so a later server-side Conversions API call can dedupe with
 * the same event_id.
 */
export const trackFBEvent = (
  eventName: string,
  params?: Record<string, unknown>,
  options?: MetaTrackOptions
) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }
  if (options?.eventId) {
    window.fbq('track', eventName, params ?? {}, { eventID: options.eventId });
  } else {
    window.fbq('track', eventName, params ?? {});
  }
};

/**
 * Generate a stable event ID for client/server Pixel + CAPI deduplication.
 * Falls back to a timestamp-based ID on platforms without crypto.randomUUID.
 */
export const generateMetaEventId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `meta-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export {};
