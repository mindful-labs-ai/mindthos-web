export const TOSS_PAYMENTS_CONFIG = {
  clientKey: import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY,
  getSuccessUrl: (planId?: string, userCouponId?: string) => {
    const baseUrl = `${window.location.origin}/payment/success`;
    const params = new URLSearchParams();
    if (planId) params.set('planId', planId);
    if (userCouponId) params.set('userCouponId', userCouponId);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  },
  failUrl: `${window.location.origin}/payment/fail`,
} as const;

if (!TOSS_PAYMENTS_CONFIG.clientKey) {
  console.warn('VITE_TOSS_PAYMENTS_CLIENT_KEY is not defined');
}
