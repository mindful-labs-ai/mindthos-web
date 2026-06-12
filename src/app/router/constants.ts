/**
 * 라우트 경로 상수
 */
export const ROUTES = {
  ROOT: '/',
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  PASSWORD_RESET: '/auth/reset-password',
  USER_VERIFY: '/user-verify',
  TERMS: '/terms',
  TERMS_AGREEMENT: '/terms-agreement',
  CLIENTS: '/clients',
  CLIENT_DETAIL: '/clients/:clientId',
  SESSIONS: '/sessions',
  SESSION_DETAIL: '/sessions/:sessionId',
  TEMPLATE: '/template',
  SETTINGS: '/settings',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAIL: '/payment/fail',
  NOT_FOUND: '*',
  GENOGRAM: '/genogram',
  CALENDAR: '/calendar',
  DOCUMENTS: '/documents',
  DOCUMENT_NEW: '/documents/new',
  DOCUMENT_VIEW: '/documents/:documentId',
  DOCUMENT_EDIT: '/documents/:documentId/edit',
  ANALYSIS: '/analysis',
  AI_SUPERVISION: '/ai-supervision',
  PSYCHOLOGY_ASSESSMENTS: '/psychology-assessments',
  UNSUBSCRIBE: '/unsubscribe',
} as const;

export const getGenogramRoute = (clientId?: string) =>
  clientId ? `/genogram?clientId=${clientId}` : '/genogram';

export const getAiSupervisionRoute = (clientId?: string) =>
  clientId ? `/ai-supervision?clientId=${clientId}` : '/ai-supervision';

export const getDocumentEditorRoute = (kind: 'consent' | 'qna') =>
  `/documents/new?kind=${kind}`;

export const getDocumentViewRoute = (documentId: string) =>
  `/documents/${documentId}`;

export const getDocumentEditRoute = (documentId: string) =>
  `/documents/${documentId}/edit`;

export const TERMS_TYPES = {
  SERVICE: 'service',
  PRIVACY: 'privacy',
  MARKETING: 'marketing',
} as const;

export type TermsType = (typeof TERMS_TYPES)[keyof typeof TERMS_TYPES];

export const getClientDetailRoute = (clientId: string | number) =>
  `/clients/${clientId}`;

export const getSessionDetailRoute = (sessionId: string) =>
  `/sessions/${sessionId}`;

export const getTermsRoute = (type: TermsType) => `/terms?type=${type}`;
