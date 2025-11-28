export const TOSS_PAYMENTS_CONFIG = {
  clientKey: import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY,
  getSuccessUrl: (planId?: string) => {
    const baseUrl = `${window.location.origin}/payment/success`;
    return planId ? `${baseUrl}?planId=${planId}` : baseUrl;
  },
  failUrl: `${window.location.origin}/payment/fail`,
} as const;

if (!TOSS_PAYMENTS_CONFIG.clientKey) {
  console.warn('VITE_TOSS_PAYMENTS_CLIENT_KEY is not defined');
}
