import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Client } from '../types';

import { ClientDetailContainer } from './ClientDetailContainer';

const directClient: Client = {
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
};

const mocks = vi.hoisted(() => ({
  clients: [] as Client[],
  directClient: null as Client | null,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ clientId: 'new-client' }),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('@/features/session/hooks/useSessionsList', () => ({
  useClientSessions: () => ({
    items: [],
    isLoading: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
}));

vi.mock('@/shared/hooks/useDevice', () => ({
  useDevice: () => ({ isMobile: false, isTablet: false }),
}));

vi.mock('@/shared/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({ current: null }),
}));

vi.mock('@/shared/hooks/useNavigateWithUtm', () => ({
  useNavigateWithUtm: () => ({ navigateWithUtm: vi.fn() }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: '81' }),
}));

vi.mock('@/widgets/client/AddClientModal', () => ({
  AddClientModal: () => null,
}));

vi.mock('@/widgets/client/ClientSidebar', () => ({
  ClientSidebar: () => <aside>client sidebar</aside>,
}));

vi.mock('@/widgets/session/SessionRecordCard', () => ({
  SessionRecordCard: () => null,
}));

vi.mock('../hooks/useClientList', () => ({
  useClientList: () => ({ clients: mocks.clients, isLoading: false }),
}));

vi.mock('../hooks/useClientById', () => ({
  useClientById: () => ({
    client: mocks.directClient,
    isLoading: false,
  }),
}));

vi.mock('./ClientDetailView', () => ({
  ClientDetailNotFoundView: () => <div>not found</div>,
  ClientDetailView: ({ client }: { client: Client; sidebar: ReactNode }) => (
    <div>resolved client: {client.name}</div>
  ),
}));

describe('ClientDetailContainer', () => {
  beforeEach(() => {
    mocks.clients = [];
    mocks.directClient = null;
  });

  it('uses direct client lookup when the cached client list is stale', () => {
    mocks.directClient = directClient;

    render(<ClientDetailContainer />);

    expect(
      screen.getByText('resolved client: 새로 발급된 내담자')
    ).toBeInTheDocument();
    expect(screen.queryByText('not found')).not.toBeInTheDocument();
  });
});
