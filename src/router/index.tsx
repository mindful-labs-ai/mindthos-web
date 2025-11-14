import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import AuthPage from '@/feature/auth/page/AuthPage';
import EmailVerificationPage from '@/feature/auth/page/EmailVerificationPage';
import { ClientListPage } from '@/feature/client/page/ClientListPage';
import ErrorPage from '@/feature/error/page/ErrorPage';
import ErrorTestPage from '@/feature/error/page/ErrorTestPage';
import NotFoundPage from '@/feature/error/page/NotFoundPage';
import HomePage from '@/feature/home/page/HomePage';
import { SessionHistoryPage } from '@/feature/session/page/SessionHistoryPage';
import { SettingsPage } from '@/feature/settings/page/SettingsPage';
import { TemplateListPage } from '@/feature/template/page/TemplateListPage';
import TermsPage from '@/feature/terms/page/TermsPage';

import { ROUTES } from './constants';
import RootLayout from './layouts/RootLayout';
import SideTabLayout from './layouts/SideTabLayout';
import { ProtectedRoute } from './protecter/ProtectedRoute';
import { PublicOnlyRoute } from './protecter/PublicOnlyRoute';

/**
 * 애플리케이션 라우터 설정
 * ProtectedRoute와 PublicOnlyRoute로 인증 기반 접근 제어
 * 경로는 constants.ts에서 중앙 관리
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
            path: ROUTES.CLIENTS,
            element: <ClientListPage />,
          },
          {
            path: ROUTES.HISTORY,
            element: <SessionHistoryPage />,
          },
          {
            path: ROUTES.TEMPLATE,
            element: <TemplateListPage />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <SettingsPage />,
          },
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
