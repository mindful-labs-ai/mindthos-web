import { useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { trackPageView } from '@/lib/mixpanel';

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
  if (pathname === ROUTES.EMAIL_VERIFICATION) return 'email_verification';
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
    const domain = getPageDomain(location.pathname);
    const from = prevPathRef.current ?? 'direct';

    trackPageView(`${domain}_page_view`, { from, to: location.pathname });

    prevPathRef.current = location.pathname;
  }, [location.pathname]);
};
