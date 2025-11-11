import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import AuthPage from '@/feature/auth/page/AuthPage';
import ErrorPage from '@/feature/error/page/ErrorPage';
import ErrorTestPage from '@/feature/error/page/ErrorTestPage';
import NotFoundPage from '@/feature/error/page/NotFoundPage';
import TermsPage from '@/feature/terms/page/TermsPage';

import { ROUTES } from './constants';
import RootLayout from './layouts/RootLayout';

/**
 * 애플리케이션 라우터 설정
 *
 * 구조:
 * - 루트 레이아웃에서 공통 에러 핸들링
 * - 중첩 라우트로 하위 페이지 구성
 * - 경로는 constants.ts에서 중앙 관리
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: ROUTES.AUTH,
        element: <AuthPage />,
        // TODO: 인증 체크 - 이미 로그인된 경우 대시보드로 리다이렉트
      },
      {
        path: ROUTES.TERMS,
        element: <TermsPage />,
      },
      {
        path: ROUTES.ERROR_TEST,
        element: <ErrorTestPage />,
      },
      // TODO: 인증이 필요한 보호된 라우트
      // {
      //   path: '/dashboard',
      //   element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
      // },
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
    ],
  },
]);
