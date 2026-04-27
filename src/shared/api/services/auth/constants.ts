export const EDGE_FUNCTION_BASE_URL = `${import.meta.env.VITE_WEBAPP_SUPABASE_URL}/functions/v1`;

export const EDGE_FUNCTION_ENDPOINTS = {
  CHECK_USER_EXISTS: '/auth/check-user-exists',
  CHECK_AUTH_METHOD: '/auth/check-auth-method',
  ACCOUNT_DELETE: '/auth/account-delete',
  RESEND_VERIFICATION: '/auth/resend-verification',
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS:
    '로그인할 수 없어요. 이메일과 비밀번호를 한 번 더 확인해 주세요.',
  EMAIL_NOT_CONFIRMED:
    '이메일 인증이 아직 끝나지 않았어요. 받은 메일을 확인해 주세요.',
  WEAK_PASSWORD: '비밀번호는 8자 이상으로 만들어 주세요.',
  RATE_LIMIT_EXCEEDED:
    '요청이 너무 자주 들어왔어요. 잠시 후 다시 시도해 주세요.',
  NETWORK_ERROR: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  GENERIC_AUTH_ERROR: '인증을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
  GENERIC_ERROR: '문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  UNKNOWN_ERROR: '예상하지 못한 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  LOGIN_FAILED: '로그인할 수 없어요.',
  SIGNUP_FAILED: '회원가입을 완료하지 못했어요.',
} as const;
