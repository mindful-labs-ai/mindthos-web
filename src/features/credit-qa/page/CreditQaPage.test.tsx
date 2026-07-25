import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CreditDevState,
  CreditHold,
} from '@/shared/api/server/creditServerApi';

import CreditQaPage from './CreditQaPage';

const mocks = vi.hoisted(() => ({
  captureDevCreditHold: vi.fn(),
  expireDevCredits: vi.fn(),
  getDevCreditState: vi.fn(),
  grantDevCredit: vi.fn(),
  placeDevCreditHold: vi.fn(),
  releaseDevCreditHold: vi.fn(),
}));

vi.mock('@/shared/api/server/creditServerApi', () => ({
  captureDevCreditHold: mocks.captureDevCreditHold,
  expireDevCredits: mocks.expireDevCredits,
  getDevCreditState: mocks.getDevCreditState,
  grantDevCredit: mocks.grantDevCredit,
  placeDevCreditHold: mocks.placeDevCreditHold,
  releaseDevCreditHold: mocks.releaseDevCreditHold,
}));

const createHold = (id: string): CreditHold => ({
  id,
  userId: '42',
  amount: 10,
  status: 'HELD',
  useType: 'credit_qa',
  sourceType: 'LOCAL_QA',
  sourceId: `${id}-source`,
  idempotencyKey: `${id}-key`,
  heldAt: '2026-07-23T00:00:00.000Z',
  expiresAt: '2026-07-23T00:15:00.000Z',
  capturedAt: null,
  releasedAt: null,
  releaseReason: null,
  allocations: [{ grantId: 'grant-1', amount: 10 }],
});

const creditState: CreditDevState = {
  wallet: {
    userId: '42',
    version: 3,
    ledgerStartedAt: '2026-07-23T00:00:00.000Z',
    createdAt: '2026-07-23T00:00:00.000Z',
    updatedAt: '2026-07-23T00:00:00.000Z',
  },
  summary: {
    walletAvailableCredit: 130,
    heldCredit: 20,
    plan: {
      planId: 'plan-1',
      subscriptionId: 'subscription-1',
      policyCode: 'LOCAL_QA_PLAN_7D',
      issuedCredit: 100,
      availableCredit: 100,
      heldCredit: 10,
      capturedCredit: 0,
      voidedCredit: 0,
      periodEndsAt: '2026-07-30T00:00:00.000Z',
    },
    promotional: {
      issuedCredit: 30,
      availableCredit: 30,
      heldCredit: 10,
      capturedCredit: 0,
      voidedCredit: 0,
      nearestExpiryAt: '2026-07-30T00:00:00.000Z',
    },
  },
  grants: [],
  holds: [createHold('hold-capture'), createHold('hold-release')],
  ledgerEntries: [],
};

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <CreditQaPage />
      </QueryClientProvider>
    ),
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDevCreditState.mockResolvedValue(creditState);
  mocks.grantDevCredit.mockResolvedValue({});
  mocks.placeDevCreditHold.mockResolvedValue({});
  mocks.captureDevCreditHold.mockResolvedValue({});
  mocks.releaseDevCreditHold.mockResolvedValue({});
  mocks.expireDevCredits.mockResolvedValue({
    expiredGrantCount: 1,
    releasedHoldCount: 0,
    state: creditState,
  });
});

describe('CreditQaPage', () => {
  it('[CREDIT-WEB-10] PLAN 지급·Hold 생성·만료 후 상태를 다시 조회한다', async () => {
    const { user } = renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'PLAN 교체 지급' })
    );
    await waitFor(() =>
      expect(mocks.grantDevCredit).toHaveBeenCalledWith({
        policyCode: 'LOCAL_QA_PLAN_7D',
        sourceId: expect.stringMatching(/^credit-qa:plan:/),
        idempotencyKey: expect.stringMatching(/^credit-qa:grant-plan:/),
      })
    );
    await screen.findByText('PLAN 지급 완료');

    await user.clear(screen.getByLabelText('금액'));
    await user.type(screen.getByLabelText('금액'), '7');
    await user.clear(screen.getByLabelText('sourceId 접두어'));
    await user.type(screen.getByLabelText('sourceId 접두어'), 'qa-source');
    await user.click(screen.getByRole('button', { name: 'Hold 생성' }));

    await waitFor(() =>
      expect(mocks.placeDevCreditHold).toHaveBeenCalledWith({
        amount: 7,
        useType: 'credit_qa',
        sourceType: 'LOCAL_QA',
        sourceId: expect.stringMatching(/^qa-source:/),
        idempotencyKey: expect.stringMatching(/^credit-qa:hold:/),
      })
    );
    await screen.findByText('Hold 생성 완료');

    await user.click(screen.getByRole('button', { name: '만료 실행' }));
    await waitFor(() =>
      expect(mocks.expireDevCredits).toHaveBeenCalledWith(expect.any(String))
    );
    await screen.findByText('만료 실행 완료');

    expect(mocks.getDevCreditState).toHaveBeenCalledTimes(4);
  });

  it('[CREDIT-WEB-11] HELD 항목의 Capture와 Release를 서버에 전달한다', async () => {
    const { user } = renderPage();

    const captureButtons = await screen.findAllByRole('button', {
      name: 'Capture',
    });
    await user.click(captureButtons[0]);
    await screen.findByText('Hold 확정 완료');

    await user.click(screen.getAllByRole('button', { name: 'Release' })[1]);
    await screen.findByText('Hold 해제 완료');

    expect(mocks.captureDevCreditHold).toHaveBeenCalledWith('hold-capture');
    expect(mocks.releaseDevCreditHold).toHaveBeenCalledWith('hold-release');
  });

  it('[CREDIT-WEB-12] 잘못된 Hold 금액과 서버 실패를 오류 상태로 표시한다', async () => {
    const { user } = renderPage();

    await user.clear(await screen.findByLabelText('금액'));
    await user.type(screen.getByLabelText('금액'), '0');
    await user.click(screen.getByRole('button', { name: 'Hold 생성' }));

    expect(
      screen.getByText('예약 금액은 0보다 커야 합니다.')
    ).toBeInTheDocument();
    expect(mocks.placeDevCreditHold).not.toHaveBeenCalled();

    mocks.placeDevCreditHold.mockRejectedValueOnce(new Error('잔액 부족'));
    await user.clear(screen.getByLabelText('금액'));
    await user.type(screen.getByLabelText('금액'), '10');
    await user.click(screen.getByRole('button', { name: 'Hold 생성' }));

    expect(await screen.findByText('잔액 부족')).toBeInTheDocument();
  });
});
