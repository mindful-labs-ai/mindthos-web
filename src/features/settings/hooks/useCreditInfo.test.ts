import { describe, expect, it, vi } from 'vitest';

import type { CreditSummary } from '@/shared/api/server/creditServerApi';
import type { Plan } from '@/shared/api/supabase/planQueries';

import { toCreditInfo } from './useCreditInfo';

vi.mock('@/shared/api/server/creditServerApi', () => ({
  getCreditSummary: vi.fn(),
}));

vi.mock('@/shared/api/supabase/planQueries', () => ({
  planService: { getPlanById: vi.fn() },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('toCreditInfo', () => {
  it('[CREDIT-WEB-01] 통합 Wallet 잔액과 구독 PLAN 지급량을 분리한다', () => {
    const summary: CreditSummary = {
      walletAvailableCredit: 105,
      heldCredit: 5,
      plan: {
        planId: 'starter-plan',
        subscriptionId: 'subscription-1',
        policyCode: 'STARTER_7D',
        issuedCredit: 100,
        availableCredit: 80,
        heldCredit: 5,
        capturedCredit: 15,
        voidedCredit: 0,
        periodEndsAt: '2026-07-23T00:00:00.000Z',
      },
      promotional: {
        issuedCredit: 30,
        availableCredit: 25,
        heldCredit: 0,
        capturedCredit: 5,
        voidedCredit: 0,
        nearestExpiryAt: '2026-07-20T00:00:00.000Z',
      },
    };
    const plan: Plan = {
      id: 'starter-plan',
      type: 'Starter',
      description: '스타터 플랜',
      price: 0,
      total_credit: 100,
      is_year: false,
    };

    const creditInfo = toCreditInfo(summary, plan);

    expect(creditInfo).toMatchObject({
      wallet: { total: 130, used: 25, remaining: 105 },
      plan: {
        total: 100,
        used: 20,
        remaining: 80,
        type: 'Starter',
      },
    });
    expect(creditInfo.wallet).not.toHaveProperty('held');
  });
});
