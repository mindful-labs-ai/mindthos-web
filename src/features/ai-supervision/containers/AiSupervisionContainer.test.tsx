import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiSupervisionContainer } from './AiSupervisionContainer';

const mocks = vi.hoisted(() => ({
  statusOptions: null as { version: number; enabled: boolean } | null,
  directClient: {
    id: 'new-client',
    counselor_id: '81',
    name: '새로 발급된 내담자',
    phone_number: '',
    email: null,
    counsel_theme: null,
    counsel_number: 0,
    counsel_done: false,
    memo: null,
    pin: false,
    created_at: '2026-08-04T00:00:00Z',
    updated_at: '2026-08-04T00:00:00Z',
    session_count: 3,
  },
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams({ clientId: 'new-client' })],
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/features/client/hooks/useClientAnalysis', () => ({
  clientAnalysisQueryKeys: {
    analysesByClient: (clientId: string) => ['client-analyses', clientId],
  },
  useClientAnalyses: () => ({
    data: [
      {
        version: 1,
        session_ids: ['session-1'],
        created_at: '2026-08-04T00:00:00Z',
        ai_supervision: {
          id: 'analysis-1',
          client_id: 'new-client',
          user_id: '81',
          session_ids: ['session-1'],
          version: 1,
          type: 'ai_supervision',
          template_id: 1,
          content: null,
          status: 'pending',
          error_message: null,
          created_at: '2026-08-04T00:00:00Z',
          updated_at: '2026-08-04T00:00:00Z',
        },
      },
    ],
    isLoading: false,
  }),
  useClientAnalysisStatus: (options: { version: number; enabled: boolean }) => {
    mocks.statusOptions = options;
  },
  useClientTemplates: () => ({ data: undefined }),
  useCreateClientAnalysis: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/features/client/hooks/useClientById', () => ({
  useClientById: () => ({ client: mocks.directClient, isLoading: false }),
}));

vi.mock('@/features/client/hooks/useClientList', () => ({
  useClientList: () => ({ clients: [], isLoading: false }),
}));

vi.mock('@/features/session/hooks/useSessionsList', () => ({
  useAllClientSessions: () => ({ data: [] }),
}));

vi.mock('@/lib/mixpanel', () => ({
  trackError: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock('@/shared/api/supabase/clientAnalysisQueries', () => ({
  clientAnalysisService: { updateAnalysisContent: vi.fn() },
}));

vi.mock('@/shared/hooks/useCreditGuard', () => ({
  useCreditGuard: () => vi.fn(),
}));

vi.mock('@/shared/hooks/useDevice', () => ({
  useDevice: () => ({ isMobile: false, isTablet: false }),
}));

vi.mock('@/shared/hooks/useNavigateWithUtm', () => ({
  useNavigateWithUtm: () => ({ setSearchParamsWithUtm: vi.fn() }),
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: '81' }),
}));

vi.mock('@/widgets/client/ClientAnalysisTab', () => ({
  ClientAnalysisTab: () => <div>analysis content</div>,
}));

vi.mock('@/widgets/client/ClientSidebar', () => ({
  ClientSidebar: () => <aside>client sidebar</aside>,
}));

vi.mock('@/widgets/client/CreateAnalysisModal', () => ({
  CreateAnalysisModal: () => null,
}));

describe('AiSupervisionContainer', () => {
  beforeEach(() => {
    mocks.statusOptions = null;
  });

  it('uses direct client data and polls a pre-issued pending analysis', () => {
    render(<AiSupervisionContainer />);

    expect(screen.getByText('새로 발급된 내담자')).toBeInTheDocument();
    expect(screen.getByText('3개의 상담 기록')).toBeInTheDocument();
    expect(mocks.statusOptions).toMatchObject({ version: 1, enabled: true });
  });
});
