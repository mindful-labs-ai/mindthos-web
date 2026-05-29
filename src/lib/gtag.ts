declare global {
  interface Window {
    gtag?: (...args: GtagCommandArgs) => void;
    dataLayer?: unknown[];
  }
}

type GtagCommandArgs =
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]
  | ['js', Date]
  | ['set', Record<string, unknown>]
  | ['set', string, unknown];

type GAUserId = number | string | null | undefined;

type GAEventParams = Record<string, unknown> & {
  userId?: number | null;
  user_id?: GAUserId;
};

const normalizeGAUserId = (userId: GAUserId): string | null | undefined => {
  if (userId === null) {
    return null;
  }

  if (typeof userId === 'number') {
    return Number.isFinite(userId) ? String(userId) : undefined;
  }

  if (typeof userId === 'string') {
    const trimmedUserId = userId.trim();
    return trimmedUserId.length > 0 ? trimmedUserId : undefined;
  }

  return undefined;
};

export const setGAUserId = (userId: GAUserId) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const normalizedUserId = normalizeGAUserId(userId);
  if (normalizedUserId === undefined) {
    return;
  }

  window.gtag('set', { user_id: normalizedUserId });
};

export const clearGAUserId = () => {
  setGAUserId(null);
};

export const trackGAEvent = (eventName: string, params?: GAEventParams) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const { userId, user_id: userIdParam, ...eventParams } = params ?? {};
  const rawUserId = userId !== undefined ? userId : userIdParam;
  const normalizedUserId = normalizeGAUserId(rawUserId);

  if (normalizedUserId !== undefined) {
    window.gtag('set', { user_id: normalizedUserId });
  }

  window.gtag('event', eventName, eventParams);
};

export {};
