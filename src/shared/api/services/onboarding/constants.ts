export const ONBOARDING_ENDPOINTS = {
  STATUS: '/onboarding/status',
  CHECK: '/onboarding/check',
  START: '/onboarding/start',
  SAVE: '/onboarding/save',
  NEXT: '/onboarding/next',
  SUCCESS: '/onboarding/success',
  COMPLETE: '/onboarding/complete',
} as const;

export const ONBOARDING_ERROR_MESSAGES = {
  STATUS_FETCH_FAILED: '온보딩 상태를 불러오지 못했어요.',
  SAVE_FAILED: '온보딩 정보를 저장하지 못했어요.',
  COMPLETE_FAILED: '온보딩을 완료하지 못했어요.',
  NETWORK_ERROR: '네트워크 연결을 확인해 주세요.',
} as const;
