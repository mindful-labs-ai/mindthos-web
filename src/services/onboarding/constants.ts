export const ONBOARDING_ENDPOINTS = {
  STATUS: '/onboarding/status',
  SAVE: '/onboarding/save',
} as const;

export const ONBOARDING_ERROR_MESSAGES = {
  STATUS_FETCH_FAILED: '온보딩 상태를 불러오는데 실패했습니다.',
  SAVE_FAILED: '온보딩 저장에 실패했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
} as const;
