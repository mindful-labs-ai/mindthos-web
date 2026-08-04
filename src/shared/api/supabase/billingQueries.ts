import type {
  BillingKeyIssueRequest,
  BillingKeyIssueResponse,
  UpgradePlanRequest,
  UpgradePlanResponse,
  CompletePlanUpgradeRequest,
} from '@/features/payment/types';
import { supabase } from '@/lib/supabase';
import { serverRequest } from '@/shared/api/server/serverClient';

const PAYMENT_ROUTES = {
  ISSUE_BILLING_KEY: '/payment/issue-billing-key',
  REGISTER_CARD: '/payment/register-card',
  INIT_UPGRADE: '/payment/init-upgrade',
  COMPLETE_UPGRADE: '/payment/complete-upgrade',
  UPGRADE: '/payment/upgrade',
  GET_CARD: '/payment/get-card',
  DELETE_CARD: '/payment/delete-card',
  PREVIEW_UPGRADE: '/payment/preview-upgrade',
  CHANGE_PLAN: '/payment/change-plan',
  RENEW: '/payment/renew',
  CANCEL: '/payment/cancel',
  CANCEL_UNDO: '/payment/cancel-undo',
} as const;

export const billingService = {
  /**
   * 빌링키 발급 요청
   */
  async issueBillingKey(
    request: BillingKeyIssueRequest
  ): Promise<BillingKeyIssueResponse> {
    return await serverRequest<BillingKeyIssueResponse>(
      PAYMENT_ROUTES.ISSUE_BILLING_KEY,
      { method: 'POST', body: request }
    );
  },

  /**
   * 카드 등록 요청 (단순 빌링키 발급 및 저장)
   */
  async registerCard(
    request: BillingKeyIssueRequest
  ): Promise<BillingKeyIssueResponse> {
    return await serverRequest<BillingKeyIssueResponse>(
      PAYMENT_ROUTES.REGISTER_CARD,
      { method: 'POST', body: request }
    );
  },

  /**
   * 플랜 업그레이드 초기화 (payments row 생성)
   */
  async initUpgrade(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    return await serverRequest<UpgradePlanResponse>(
      PAYMENT_ROUTES.INIT_UPGRADE,
      { method: 'POST', body: request }
    );
  },

  /**
   * 플랜 업그레이드 완료 (빌링키 발급 + 결제 + 구독 생성)
   */
  async completePlanUpgrade(
    request: CompletePlanUpgradeRequest
  ): Promise<UpgradePlanResponse> {
    return await serverRequest<UpgradePlanResponse>(
      PAYMENT_ROUTES.COMPLETE_UPGRADE,
      { method: 'POST', body: request }
    );
  },

  /**
   * 기존 빌링키로 플랜 업그레이드 (카드가 이미 등록된 경우)
   */
  async upgradePlan(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    return await serverRequest<UpgradePlanResponse>(PAYMENT_ROUTES.UPGRADE, {
      method: 'POST',
      body: request,
    });
  },

  /**
   * 사용자의 최신 구독 정보 조회
   * subscribe 테이블은 1:N 관계로 히스토리를 관리하므로 start_at 기준 최신 레코드 조회
   * - 새로운 구독/재결제 시마다 새 row 추가
   * - start_at: 구독 시작일 (기준 정렬 컬럼)
   * - end_at: 구독 만료일
   * - scheduled_plan_id: 예약된 플랜 변경 (다운그레이드/해지)
   * - billing_key는 card 테이블에서 관리됨
   */
  async getSubscription(userId: number) {
    const { data, error } = await supabase
      .from('subscribe')
      .select(
        'id, user_id, plan_id, start_at, end_at, last_paid_at, scheduled_plan_id'
      )
      .eq('user_id', userId)
      .order('start_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`구독 정보 조회 실패: ${error.message}`);
    }

    return data;
  },

  /**
   * 사용자의 카드 정보 조회
   */
  async getCard(_userId: number) {
    const response = await serverRequest<{
      success: boolean;
      card: {
        type: string;
        company: string;
        number: string;
        createdAt: string;
      } | null;
    }>(PAYMENT_ROUTES.GET_CARD);

    // 조회 실패를 삼키면 '카드 없음'과 구분되지 않아 등록한 카드가 사라진 것처럼 보인다
    if (!response.success) {
      throw new Error('카드 정보를 불러오지 못했어요.');
    }

    return response.card;
  },

  /**
   * 카드 정보 삭제
   */
  async deleteCard(): Promise<void> {
    await serverRequest<{ success: boolean; message: string }>(
      PAYMENT_ROUTES.DELETE_CARD,
      { method: 'DELETE' }
    );
  },

  /**
   * 업그레이드 미리보기 (할인 금액 계산)
   */
  async previewUpgrade(planId: string): Promise<{
    currentPlan: {
      id: string;
      type: string;
      price: number;
      totalCredit: number;
    };
    newPlan: { id: string; type: string; price: number; totalCredit: number };
    remainingCredit: number;
    discount: number;
    finalAmount: number;
  }> {
    return await serverRequest(PAYMENT_ROUTES.PREVIEW_UPGRADE, {
      method: 'POST',
      body: { planId },
    });
  },

  /**
   * 플랜 변경 (업그레이드/다운그레이드)
   * - 업그레이드: 즉시 적용 + 할인
   * - 다운그레이드: 구독 종료 후 적용
   */
  async changePlan(
    planId: string,
    userCouponId?: string
  ): Promise<{
    type: 'upgrade' | 'downgrade';
    newPlan: string;
    discount?: number;
    finalAmount?: number;
    couponDiscount?: number;
    appliedAt?: string;
    effectiveAt?: string | null;
  }> {
    return await serverRequest(PAYMENT_ROUTES.CHANGE_PLAN, {
      method: 'POST',
      body: {
        planId,
        ...(userCouponId && { userCouponId }),
      },
    });
  },

  /**
   * 플랜 재갱신 (현재 플랜 동일하게 재결제 + 크레딧 초기화)
   */
  async renewPlan(userCouponId?: string): Promise<{
    success: boolean;
    subscribeId: string;
    message: string;
  }> {
    return await serverRequest<{
      success: boolean;
      subscribeId: string;
      message: string;
    }>(PAYMENT_ROUTES.RENEW, {
      method: 'POST',
      body: { ...(userCouponId && { userCouponId }) },
    });
  },

  /**
   * 구독 해지 (구독 종료 후 FREE 전환)
   */
  async cancelSubscription(): Promise<{
    canceledPlan: string;
    effectiveAt: string | null;
  }> {
    return await serverRequest(PAYMENT_ROUTES.CANCEL, {
      method: 'POST',
      body: {},
    });
  },

  /**
   * 구독 해지 취소 (예약된 다운그레이드/해지 취소)
   */
  async undoCancellation(): Promise<void> {
    await serverRequest(PAYMENT_ROUTES.CANCEL_UNDO, {
      method: 'POST',
      body: {},
    });
  },
};
