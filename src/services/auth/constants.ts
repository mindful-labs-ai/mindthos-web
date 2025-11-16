export const EDGE_FUNCTION_BASE_URL = `${import.meta.env.VITE_WEBAPP_SUPABASE_URL}/functions/v1`;

export const EDGE_FUNCTION_ENDPOINTS = {
  CHECK_USER_EXISTS: '/auth/check-user-exists',
  ACCOUNT_DELETE: '/auth/account-delete',
  RESEND_VERIFICATION: '/auth/resend-verification',
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  EMAIL_NOT_CONFIRMED:
    '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
  WEAK_PASSWORD: '비밀번호는 최소 8자 이상이어야 합니다.',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  GENERIC_AUTH_ERROR: '인증 중 오류가 발생했습니다.',
  GENERIC_ERROR: '오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  LOGIN_FAILED: '로그인에 실패했습니다.',
  SIGNUP_FAILED: '회원가입에 실패했습니다.',
} as const;
