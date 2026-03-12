import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';

import { useDevice } from './useDevice';
import { useNavigateWithUtm } from './useNavigateWithUtm';

/** 모바일에서도 접근을 허용하는 경로 */
const MOBILE_ALLOWED_PATHS = new Set<string>([
  ROUTES.ROOT,
  ROUTES.TERMS_AGREEMENT,
]);

/**
 * 모바일/태블릿 디바이스에서 "/" 라우트로 고정시키는 훅
 *
 * 현재 반응형 웹 리팩터링 중이므로 비활성화 상태.
 * 모든 경로에서 모바일 접근을 허용합니다.
 */
export const useMobileRouteGuard = () => {
  // 반응형 웹 지원으로 모바일 라우트 가드 비활성화
};
