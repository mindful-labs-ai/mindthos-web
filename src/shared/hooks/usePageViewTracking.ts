import { useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { SENSITIVE_PATH_PREFIX, trackPageView } from '@/lib/mixpanel';

const getPageDomain = (pathname: string): string => {
  if (pathname === ROUTES.ROOT) return 'home';
  if (pathname.startsWith(ROUTES.CLIENTS + '/')) return 'client_detail';
  if (pathname === ROUTES.CLIENTS) return 'client_list';
  if (pathname.startsWith(ROUTES.SESSIONS + '/')) return 'session_detail';
  if (pathname === ROUTES.SESSIONS) return 'session_history';
  if (pathname === ROUTES.TEMPLATE) return 'template';
  if (pathname === ROUTES.GENOGRAM) return 'genogram';
  if (pathname === ROUTES.SETTINGS) return 'settings';
  if (pathname === ROUTES.AUTH_CALLBACK) return 'auth_callback';
  if (pathname === ROUTES.PASSWORD_RESET) return 'password_reset';
  if (pathname === ROUTES.AUTH) return 'auth';
  if (pathname === ROUTES.TERMS) return 'terms';
  if (pathname === ROUTES.PAYMENT_SUCCESS) return 'payment_success';
  if (pathname === ROUTES.PAYMENT_FAIL) return 'payment_fail';
  return 'unknown';
};

export const usePageViewTracking = () => {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // 민감 공유문서 화면은 페이지뷰 트래킹 제외 — 경로에 bearer 토큰이 들어 있어
    // to/다음 페이지 from에 남으면 링크 권한이 유출된다. prevPath도 갱신하지 않아
    // 이후 이동의 from에도 토큰이 새지 않게 한다.
    if (location.pathname.toLowerCase().startsWith(SENSITIVE_PATH_PREFIX))
      return;

    const domain = getPageDomain(location.pathname);
    const from = prevPathRef.current ?? 'direct';

    trackPageView(`${domain}_page_view`, { from, to: location.pathname });

    prevPathRef.current = location.pathname;
  }, [location.pathname]);
};
