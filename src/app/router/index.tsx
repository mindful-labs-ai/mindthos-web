import { createBrowserRouter } from 'react-router-dom';

import AuthCallbackPage from '@/features/auth/page/AuthCallbackPage';
import AuthPage from '@/features/auth/page/AuthPage';
import EmailVerificationPage from '@/features/auth/page/EmailVerificationPage';
import UserVerifyPage from '@/features/auth/page/UserVerifyPage';
import ClientDetailPage from '@/features/client/page/ClientDetailPage';
import ClientListPage from '@/features/client/page/ClientListPage';
import ErrorPage from '@/features/error/page/ErrorPage';
import NotFoundPage from '@/features/error/page/NotFoundPage';
import GenogramClientPage from '@/features/genogram/pages/GenogramClientPage';
import HomePage from '@/features/home/page/HomePage';
import SessionDetailPage from '@/features/session/page/SessionDetailPage';
import SessionHistoryPage from '@/features/session/page/SessionHistoryPage';
import SettingsPage from '@/features/settings/page/SettingsPage';
import TemplateListPage from '@/features/template/page/TemplateListPage';
import TermsPage from '@/features/terms/page/TermsPage';
import TermsAgreementPage from '@/features/terms-agreement/page/TermsAgreementPage';
import PaymentFail from '@/widgets/payment/PaymentFail';
import PaymentSuccess from '@/widgets/payment/PaymentSuccess';

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
          <ProtectedRoute skipTermsCheck skipSignupCheck>
            <TermsAgreementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_VERIFY,
        element: (
          <ProtectedRoute skipSignupCheck>
            <UserVerifyPage />
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
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
    ],
  },
]);
