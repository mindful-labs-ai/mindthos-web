import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { useDevice } from './useDevice';
import { useNavigateWithUtm } from './useNavigateWithUtm';

/**
 * 모바일/태블릿 디바이스에서 "/" 라우트로 고정시키는 훅
 *
 * 모바일/태블릿 기기에서 다른 경로로 이동하려고 시도하면 자동으로 "/"로 리다이렉트됩니다.
 */
export const useMobileRouteGuard = () => {
  const { isMobile } = useDevice();
  const location = useLocation();
  const { navigateWithUtm } = useNavigateWithUtm();

  // 모바일 또는 태블릿이면 라우트 잠금
  const isRouteLocked = isMobile;

  useEffect(() => {
    // 데스크톱이 아니고 현재 경로가 "/"가 아니면 "/"로 리다이렉트 (UTM 자동 유지)
    if (isRouteLocked && location.pathname !== '/') {
      navigateWithUtm('/', { replace: true });
    }
  }, [isRouteLocked, location.pathname, navigateWithUtm]);
};
