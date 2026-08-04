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

vi.mock('@/shared/api/supabase/billingQueries', () => ({
  billingService: { getSubscription: vi.fn() },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

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

describe('toCreditInfo', () => {
  it('[CREDIT-WEB-01] 통합 Wallet 잔액과 구독 PLAN 지급량을 분리한다', () => {
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

  it('[CREDIT-WEB-02] 해지 예약된 subscribe 행의 scheduled_plan_id를 노출한다', () => {
    const creditInfo = toCreditInfo(summary, plan, {
      id: 'subscription-1',
      user_id: 1,
      plan_id: 'starter-plan',
      start_at: '2026-06-23T00:00:00.000Z',
      end_at: '2026-07-23T00:00:00.000Z',
      last_paid_at: '2026-06-23T00:00:00.000Z',
      scheduled_plan_id: 'free-plan',
    });

    expect(creditInfo.subscription.scheduled_plan_id).toBe('free-plan');
    expect(creditInfo.subscription.start_at).toBe('2026-06-23T00:00:00.000Z');
  });

  it('[CREDIT-WEB-03] 예약이 없거나 subscribe 행이 없으면 null을 유지한다', () => {
    expect(toCreditInfo(summary, plan, null).subscription).toMatchObject({
      start_at: null,
      scheduled_plan_id: null,
    });
    expect(
      toCreditInfo(summary, plan, {
        id: 'subscription-1',
        user_id: 1,
        plan_id: 'starter-plan',
        start_at: '2026-06-23T00:00:00.000Z',
        end_at: '2026-07-23T00:00:00.000Z',
        last_paid_at: '2026-06-23T00:00:00.000Z',
        scheduled_plan_id: null,
      }).subscription.scheduled_plan_id
    ).toBeNull();
  });
});
