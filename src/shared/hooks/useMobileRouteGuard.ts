import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/router/constants';

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
 * 모바일/태블릿 기기에서 다른 경로로 이동하려고 시도하면 자동으로 "/"로 리다이렉트됩니다.
 * 단, 약관 동의 페이지 등 필수 경로는 예외로 허용합니다.
 */
export const useMobileRouteGuard = () => {
  const { isMobile } = useDevice();
  const location = useLocation();
  const { navigateWithUtm } = useNavigateWithUtm();

  // 모바일 또는 태블릿이면 라우트 잠금
  const isRouteLocked = isMobile;

  useEffect(() => {
    if (isRouteLocked && !MOBILE_ALLOWED_PATHS.has(location.pathname)) {
      navigateWithUtm('/', { replace: true });
    }
  }, [isRouteLocked, location.pathname, navigateWithUtm]);
};
