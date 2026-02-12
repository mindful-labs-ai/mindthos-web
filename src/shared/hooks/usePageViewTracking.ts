import { useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

import { trackPageView } from '@/lib/mixpanel';

const getPageDomain = (pathname: string): string => {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/clients/')) return 'client_detail';
  if (pathname === '/clients') return 'client_list';
  if (pathname.startsWith('/sessions/')) return 'session_detail';
  if (pathname === '/sessions') return 'session_history';
  if (pathname === '/template') return 'template';
  if (pathname === '/genogram') return 'genogram';
  if (pathname === '/settings') return 'settings';
  if (pathname === '/auth/callback') return 'auth_callback';
  if (pathname === '/auth/verify-email') return 'email_verification';
  if (pathname === '/auth') return 'auth';
  if (pathname === '/terms') return 'terms';
  if (pathname === '/payment/success') return 'payment_success';
  if (pathname === '/payment/fail') return 'payment_fail';
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
