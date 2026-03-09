import { createBrowserRouter } from 'react-router-dom';

import AuthCallbackPage from '@/feature/auth/page/AuthCallbackPage';
import AuthPage from '@/feature/auth/page/AuthPage';
import EmailVerificationPage from '@/feature/auth/page/EmailVerificationPage';
import { ClientDetailPage } from '@/feature/client/page/ClientDetailPage';
import { ClientListPage } from '@/feature/client/page/ClientListPage';
import ErrorPage from '@/feature/error/page/ErrorPage';
import ErrorTestPage from '@/feature/error/page/ErrorTestPage';
import NotFoundPage from '@/feature/error/page/NotFoundPage';
import { GenogramClientPage } from '@/feature/genogram/pages/GenogramClientPage';
import HomePage from '@/feature/home/page/HomePage';
import { PaymentFail } from '@/feature/payment/components/PaymentFail';
import { PaymentSuccess } from '@/feature/payment/components/PaymentSuccess';
import { ReportPOCPage } from '@/feature/report/poc/ReportPOCPage';
import { SessionDetailPage } from '@/feature/session/page/SessionDetailPage';
import { SessionHistoryPage } from '@/feature/session/page/SessionHistoryPage';
import { SettingsPage } from '@/feature/settings/page/SettingsPage';
import { TemplateListPage } from '@/feature/template/page/TemplateListPage';
import TermsPage from '@/feature/terms/page/TermsPage';
import TermsAgreementPage from '@/feature/terms-agreement/page/TermsAgreementPage';

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
            path: '/clients/:clientId',
            element: <ClientDetailPage />,
          },
          {
            path: ROUTES.SESSIONS,
            element: <SessionHistoryPage />,
            children: [
              {
                path: ':sessionId',
                element: <SessionDetailPage />,
              },
            ],
          },
          {
            path: ROUTES.TEMPLATE,
            element: <TemplateListPage />,
          },
          {
            path: ROUTES.GENOGRAM,
            element: <GenogramClientPage />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <SettingsPage />,
          },
        ],
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
        path: ROUTES.AUTH_CALLBACK,
        element: <AuthCallbackPage />,
      },
      {
        path: ROUTES.EMAIL_VERIFICATION,
        element: <EmailVerificationPage />,
      },
      {
        path: ROUTES.TERMS_AGREEMENT,
        element: (
          <ProtectedRoute skipTermsCheck>
            <TermsAgreementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TERMS,
        element: <TermsPage />,
      },
      {
        path: ROUTES.PAYMENT_SUCCESS,
        element: (
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PAYMENT_FAIL,
        element: (
          <ProtectedRoute>
            <PaymentFail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ERROR_TEST,
        element: <ErrorTestPage />,
      },
      {
        path: ROUTES.REPORT_POC,
        element: <ReportPOCPage />,
      },
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
    ],
  },
]);
