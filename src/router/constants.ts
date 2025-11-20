/**
 * 라우트 경로 상수
 */
export const ROUTES = {
  ROOT: '/',
  AUTH: '/auth',
  EMAIL_VERIFICATION: '/auth/verify-email',
  TERMS: '/terms',
  CLIENTS: '/clients',
  HISTORY: '/history',
  SESSION_DETAIL: '/history/:sessionId',
  TEMPLATE: '/template',
  SETTINGS: '/settings',
  ERROR_TEST: '/error-test',
  NOT_FOUND: '*',
} as const;

export const TERMS_TYPES = {
  SERVICE: 'service',
  PRIVACY: 'privacy',
} as const;

export type TermsType = (typeof TERMS_TYPES)[keyof typeof TERMS_TYPES];

export const getClientDetailRoute = (clientId: string | number) =>
  `/clients/${clientId}`;

export const getSessionDetailRoute = (sessionId: string) =>
  `/history/${sessionId}`;

export const getTermsRoute = (type: TermsType) => `/terms?type=${type}`;
