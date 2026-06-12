import { createBrowserRouter } from 'react-router-dom';

import AiSupervisionPage from '@/features/ai-supervision/pages/AiSupervisionPage';
import AuthCallbackPage from '@/features/auth/page/AuthCallbackPage';
import AuthPage from '@/features/auth/page/AuthPage';
import PasswordResetPage from '@/features/auth/page/PasswordResetPage';
import UserVerifyPage from '@/features/auth/page/UserVerifyPage';
import CalendarPage from '@/features/calendar/page/CalendarPage';
import ClientDetailPage from '@/features/client/page/ClientDetailPage';
import ClientListPage from '@/features/client/page/ClientListPage';
import DocumentEditorPage from '@/features/document/page/DocumentEditorPage';
import DocumentPage from '@/features/document/page/DocumentPage';
import DocumentViewPage from '@/features/document/page/DocumentViewPage';
import ErrorPage from '@/features/error/page/ErrorPage';
import NotFoundPage from '@/features/error/page/NotFoundPage';
import GenogramClientPage from '@/features/genogram/pages/GenogramClientPage';
import HomePage from '@/features/home/page/HomePage';
import PsychologyAssessmentsPage from '@/features/psychology-assessments/pages/PsychologyAssessmentsPage';
import SessionDetailPage from '@/features/session/page/SessionDetailPage';
import SessionHistoryPage from '@/features/session/page/SessionHistoryPage';
import SettingsPage from '@/features/settings/page/SettingsPage';
import TemplateListPage from '@/features/template/page/TemplateListPage';
import TermsPage from '@/features/terms/page/TermsPage';
import TermsAgreementPage from '@/features/terms-agreement/page/TermsAgreementPage';
import UnsubscribePage from '@/features/unsubscribe/page/UnsubscribePage';
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
            path: ROUTES.CALENDAR,
            element: <CalendarPage />,
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
            path: ROUTES.DOCUMENTS,
            element: <DocumentPage />,
          },
          {
            path: ROUTES.DOCUMENT_NEW,
            element: <DocumentEditorPage />,
          },
          {
            path: ROUTES.DOCUMENT_VIEW,
            element: <DocumentViewPage />,
          },
          {
            path: ROUTES.DOCUMENT_EDIT,
            element: <DocumentEditorPage />,
          },
          {
            path: ROUTES.GENOGRAM,
            element: <GenogramClientPage />,
          },
          {
            path: ROUTES.AI_SUPERVISION,
            element: <AiSupervisionPage />,
          },
          {
            path: ROUTES.PSYCHOLOGY_ASSESSMENTS,
            element: <PsychologyAssessmentsPage />,
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
        path: ROUTES.PASSWORD_RESET,
        element: <PasswordResetPage />,
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
        path: ROUTES.UNSUBSCRIBE,
        element: <UnsubscribePage />,
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
