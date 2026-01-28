/**
 * 라우트 경로 상수
 */
export const ROUTES = {
  ROOT: '/',
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  EMAIL_VERIFICATION: '/auth/verify-email',
  TERMS: '/terms',
  CLIENTS: '/clients',
  CLIENT_DETAIL: '/clients/:clientId',
  SESSIONS: '/sessions',
  SESSION_DETAIL: '/sessions/:sessionId',
  TEMPLATE: '/template',
  SETTINGS: '/settings',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAIL: '/payment/fail',
  ERROR_TEST: '/error-test',
  NOT_FOUND: '*',
  GENOGRAM: '/genogram',
} as const;

export const TERMS_TYPES = {
  SERVICE: 'service',
  PRIVACY: 'privacy',
} as const;

export type TermsType = (typeof TERMS_TYPES)[keyof typeof TERMS_TYPES];

export const getClientDetailRoute = (clientId: string | number) =>
  `/clients/${clientId}`;

export const getSessionDetailRoute = (sessionId: string) =>
  `/sessions/${sessionId}`;

export const getTermsRoute = (type: TermsType) => `/terms?type=${type}`;
