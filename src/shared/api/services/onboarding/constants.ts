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
  STATUS_FETCH_FAILED: '온보딩 상태를 불러오는데 실패했습니다.',
  SAVE_FAILED: '온보딩 저장에 실패했습니다.',
  COMPLETE_FAILED: '온보딩 완료 처리에 실패했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
} as const;
