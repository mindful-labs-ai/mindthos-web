import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import AuthPage from '@/feature/auth/page/AuthPage';
import EmailVerificationPage from '@/feature/auth/page/EmailVerificationPage';
import { ClientListPage } from '@/feature/client/page/ClientListPage';
import ErrorPage from '@/feature/error/page/ErrorPage';
import ErrorTestPage from '@/feature/error/page/ErrorTestPage';
import NotFoundPage from '@/feature/error/page/NotFoundPage';
import HomePage from '@/feature/home/page/HomePage';
import TermsPage from '@/feature/terms/page/TermsPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { ROUTES } from './constants';
import RootLayout from './layouts/RootLayout';
import SideTabLayout from './layouts/SideTabLayout';

/**
 * 애플리케이션 라우터 설정
 *
 * 구조:
 * - 루트 레이아웃에서 공통 에러 핸들링
 * - 중첩 라우트로 하위 페이지 구성
 * - 경로는 constants.ts에서 중앙 관리
 * - PublicOnlyRoute: 비로그인 사용자만 접근 (로그인 페이지 등)
 * - ProtectedRoute: 로그인한 사용자만 접근 (대시보드 등)
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: (
          <ProtectedRoute>
            <SideTabLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: '/clients',
            element: <ClientListPage />,
          },
          // TODO: 다른 메인 페이지들 (상담 기록, 템플릿 등)
        ],
      },
      {
        path: '/demo',
        element: <App />,
      },
      {
        path: ROUTES.AUTH,
        element: (
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: ROUTES.EMAIL_VERIFICATION,
        element: <EmailVerificationPage />,
      },
      {
        path: ROUTES.TERMS,
        element: <TermsPage />,
      },
      {
        path: ROUTES.ERROR_TEST,
        element: <ErrorTestPage />,
      },
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
    ],
  },
]);
