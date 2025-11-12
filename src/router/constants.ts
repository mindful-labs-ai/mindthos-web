/**
 * 애플리케이션의 모든 라우트 경로를 관리하는 상수
 */
export const ROUTES = {
  ROOT: '/',
  AUTH: '/auth',
  EMAIL_VERIFICATION: '/auth/verify-email',
  TERMS: '/terms',
  ERROR_TEST: '/error-test',
  NOT_FOUND: '*',
} as const;

/**
 * Terms 페이지의 쿼리 파라미터 타입
 */
export const TERMS_TYPES = {
  SERVICE: 'service',
  PRIVACY: 'privacy',
} as const;

export type TermsType = (typeof TERMS_TYPES)[keyof typeof TERMS_TYPES];
