import { Suspense, lazy } from 'react';

import { createBrowserRouter } from 'react-router-dom';

import { Spinner } from '@/shared/ui/composites/Spinner';

import { ROUTES } from './constants';
import RootLayout from './layouts/RootLayout';
import SideTabLayout from './layouts/SideTabLayout';
import { ProtectedRoute } from './protecter/ProtectedRoute';
import { PublicOnlyRoute } from './protecter/PublicOnlyRoute';

// Lazy-loaded page components
const HomePage = lazy(() => import('@/features/home/page/HomePage'));
const ClientListPage = lazy(
  () => import('@/features/client/page/ClientListPage')
);
const ClientDetailPage = lazy(
  () => import('@/features/client/page/ClientDetailPage')
);
const SessionHistoryPage = lazy(
  () => import('@/features/session/page/SessionHistoryPage')
);
const SessionDetailPage = lazy(
  () => import('@/features/session/page/SessionDetailPage')
);
const TemplateListPage = lazy(
  () => import('@/features/template/page/TemplateListPage')
);
const GenogramClientPage = lazy(
  () => import('@/features/genogram/pages/GenogramClientPage')
);
const SettingsPage = lazy(
  () => import('@/features/settings/page/SettingsPage')
);
const AuthPage = lazy(() => import('@/features/auth/page/AuthPage'));
const AuthCallbackPage = lazy(
  () => import('@/features/auth/page/AuthCallbackPage')
);
const EmailVerificationPage = lazy(
  () => import('@/features/auth/page/EmailVerificationPage')
);
const TermsPage = lazy(() => import('@/features/terms/page/TermsPage'));
const TermsAgreementPage = lazy(
  () => import('@/features/terms-agreement/page/TermsAgreementPage')
);
const PaymentSuccess = lazy(() => import('@/widgets/payment/PaymentSuccess'));
const PaymentFail = lazy(() => import('@/widgets/payment/PaymentFail'));
const ErrorPage = lazy(() => import('@/features/error/page/ErrorPage'));
const ErrorTestPage = lazy(() => import('@/features/error/page/ErrorTestPage'));
const NotFoundPage = lazy(() => import('@/features/error/page/NotFoundPage'));
const ReportPOCPage = lazy(() => import('@/features/report/poc/ReportPOCPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={<Spinner className="flex h-full items-center justify-center" />}
  >
    {children}
  </Suspense>
);

/**
 * 애플리케이션 라우터 설정
 * ProtectedRoute와 PublicOnlyRoute로 인증 기반 접근 제어
 * 경로는 constants.ts에서 중앙 관리
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    element: <RootLayout />,
    errorElement: (
      <SuspenseWrapper>
        <ErrorPage />
      </SuspenseWrapper>
    ),
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
            element: (
              <SuspenseWrapper>
                <HomePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.CLIENTS,
            element: (
              <SuspenseWrapper>
                <ClientListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: '/clients/:clientId',
            element: (
              <SuspenseWrapper>
                <ClientDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.SESSIONS,
            element: (
              <SuspenseWrapper>
                <SessionHistoryPage />
              </SuspenseWrapper>
            ),
            children: [
              {
                path: ':sessionId',
                element: (
                  <SuspenseWrapper>
                    <SessionDetailPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
          {
            path: ROUTES.TEMPLATE,
            element: (
              <SuspenseWrapper>
                <TemplateListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.GENOGRAM,
            element: (
              <SuspenseWrapper>
                <GenogramClientPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.SETTINGS,
            element: (
              <SuspenseWrapper>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: ROUTES.AUTH,
        element: (
          <PublicOnlyRoute>
            <SuspenseWrapper>
              <AuthPage />
            </SuspenseWrapper>
          </PublicOnlyRoute>
        ),
      },
      {
        path: ROUTES.AUTH_CALLBACK,
        element: (
          <SuspenseWrapper>
            <AuthCallbackPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.EMAIL_VERIFICATION,
        element: (
          <SuspenseWrapper>
            <EmailVerificationPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.TERMS_AGREEMENT,
        element: (
          <ProtectedRoute skipTermsCheck>
            <SuspenseWrapper>
              <TermsAgreementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TERMS,
        element: (
          <SuspenseWrapper>
            <TermsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.PAYMENT_SUCCESS,
        element: (
          <ProtectedRoute>
            <SuspenseWrapper>
              <PaymentSuccess />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PAYMENT_FAIL,
        element: (
          <ProtectedRoute>
            <SuspenseWrapper>
              <PaymentFail />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ERROR_TEST,
        element: (
          <SuspenseWrapper>
            <ErrorTestPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.REPORT_POC,
        element: (
          <SuspenseWrapper>
            <ReportPOCPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.NOT_FOUND,
        element: (
          <SuspenseWrapper>
            <NotFoundPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
