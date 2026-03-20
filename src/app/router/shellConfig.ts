import { matchPath } from 'react-router-dom';

import { ROUTES } from './constants';

/**
 * AppShell의 sidebar/header를 숨기는 라우트 패턴 목록
 * 여기에 패턴을 추가하면 해당 라우트에서 AppShell이 chromeless 모드로 동작
 */
export const CHROMELESS_ROUTES = [ROUTES.SESSION_DETAIL, ROUTES.CLIENT_DETAIL] as const;

/**
 * 현재 pathname이 chromeless 라우트에 해당하는지 확인
 */
export const isChromelessRoute = (pathname: string): boolean =>
  CHROMELESS_ROUTES.some((pattern) => matchPath(pattern, pathname) !== null);
