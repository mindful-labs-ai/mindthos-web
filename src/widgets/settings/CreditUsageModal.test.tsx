import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CreditLedgerEntry } from '@/shared/api/server/creditServerApi';

import { CreditUsageModal } from './CreditUsageModal';

const mocks = vi.hoisted(() => ({
  fetchNextPage: vi.fn(),
  trackEvent: vi.fn(),
}));

const ledgerEntry = (
  overrides: Partial<CreditLedgerEntry>
): CreditLedgerEntry => ({
  id: 'ledger-1',
  userId: '42',
  grantId: 'grant-1',
  holdId: null,
  entryType: 'HOLD_CAPTURED',
  fromBucket: 'HELD',
  toBucket: 'CAPTURED',
  amount: 10,
  idempotencyKey: 'entry-1',
  occurredAt: '2026-07-22T08:00:00.000Z',
  metadata: { useType: 'session_creation' },
  ...overrides,
});

vi.mock('@/features/settings/hooks/useCreditLogs', () => ({
  useCreditLogs: () => ({
    data: {
      pages: [
        {
          items: [ledgerEntry({ id: 'ledger-1' })],
          nextCursor: 'cursor-2',
        },
        {
          items: [
            ledgerEntry({
              id: 'ledger-2',
              entryType: 'GRANTED',
              amount: 30,
              metadata: null,
            }),
          ],
          nextCursor: null,
        },
      ],
      pageParams: [null, 'cursor-2'],
    },
    fetchNextPage: mocks.fetchNextPage,
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: false }),
}));

vi.mock('@/lib/mixpanel', () => ({
  trackEvent: mocks.trackEvent,
}));

vi.mock('@/shared/hooks/useDevice', () => ({
  useDevice: () => ({ isMobile: false, isTablet: false }),
}));

vi.mock('@/shared/ui', () => ({
  MobileModalHeader: () => null,
}));

vi.mock('@/shared/ui/composites/Modal', () => ({
  Modal: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <>{children}</> : null,
}));

describe('CreditUsageModal', () => {
  it('[CREDIT-WEB-07] cursor로 누적된 모든 페이지를 Wallet 원장 형식으로 표시한다', () => {
    render(<CreditUsageModal open onOpenChange={vi.fn()} />);

    expect(screen.getByText('축어록 생성')).toBeInTheDocument();
    expect(screen.getByText('10 크레딧')).toBeInTheDocument();
    expect(screen.getByText('크레딧 지급')).toBeInTheDocument();
    expect(screen.getByText('30 크레딧')).toBeInTheDocument();
    expect(
      screen.getByText(/이전 크레딧 변동 기록을 계속 불러와요/)
    ).toBeInTheDocument();
  });
});
