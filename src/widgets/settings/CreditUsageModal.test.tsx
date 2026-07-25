import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CreditHistoryItem } from '@/shared/api/server/creditServerApi';

import { CreditUsageModal } from './CreditUsageModal';

const mocks = vi.hoisted(() => ({
  fetchNextPage: vi.fn(),
  trackEvent: vi.fn(),
}));

const historyItem = (
  overrides: Partial<CreditHistoryItem>
): CreditHistoryItem => ({
  id: 'history-1',
  holdId: null,
  eventType: 'HOLD_CAPTURED',
  amountDelta: -10,
  occurredAt: '2026-07-22T08:00:00.000Z',
  metadata: { useType: 'session_creation' },
  ...overrides,
});

vi.mock('@/features/settings/hooks/useCreditLogs', () => ({
  useCreditLogs: () => ({
    data: {
      pages: [
        {
          items: [historyItem({ id: 'history-1' })],
          nextCursor: 'cursor-2',
        },
        {
          items: [
            historyItem({
              id: 'history-2',
              eventType: 'GRANTED',
              amountDelta: 30,
              metadata: null,
            }),
            historyItem({
              id: 'history-3',
              amountDelta: -50,
              metadata: { useType: 'billing_credit_discount' },
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
  it('[CREDIT-WEB-07 / CREDIT-WEB-14] logical signed history와 결제 할인 라벨을 표시한다', () => {
    render(<CreditUsageModal open onOpenChange={vi.fn()} />);

    expect(screen.getByText('축어록 생성')).toBeInTheDocument();
    expect(screen.getByText('-10 크레딧')).toBeInTheDocument();
    expect(screen.getByText('크레딧 지급')).toBeInTheDocument();
    expect(screen.getByText('30 크레딧')).toBeInTheDocument();
    expect(screen.getByText('플랜 잔여 크레딧 할인')).toBeInTheDocument();
    expect(screen.getByText('-50 크레딧')).toBeInTheDocument();
    expect(
      screen.getByText(/이전 크레딧 변동 기록을 계속 불러와요/)
    ).toBeInTheDocument();
  });
});
