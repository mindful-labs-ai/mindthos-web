import { supabase } from '@/lib/supabase';
import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

import type {
  BillingKeyIssueRequest,
  BillingKeyIssueResponse,
  UpgradePlanRequest,
  UpgradePlanResponse,
  CompletePlanUpgradeRequest,
} from '../types';

export const billingService = {
  /**
   * 빌링키 발급 요청 (Edge Function 호출)
   */
  async issueBillingKey(
    request: BillingKeyIssueRequest
  ): Promise<BillingKeyIssueResponse> {
    return await callEdgeFunction<BillingKeyIssueResponse>(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.ISSUE_BILLING_KEY,
      request
    );
  },

  /**
   * 카드 등록 요청 (단순 빌링키 발급 및 저장)
   */
  async registerCard(
    request: BillingKeyIssueRequest
  ): Promise<BillingKeyIssueResponse> {
    return await callEdgeFunction<BillingKeyIssueResponse>(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.REGISTER_CARD,
      request
    );
  },

  /**
   * 플랜 업그레이드 초기화 (payments row 생성)
   */
  async initUpgrade(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    return await callEdgeFunction<UpgradePlanResponse>(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.INIT_UPGRADE,
      request
    );
  },

  /**
   * 플랜 업그레이드 완료 (빌링키 발급 + 결제 + 구독 생성)
   */
  async completePlanUpgrade(
    request: CompletePlanUpgradeRequest
  ): Promise<UpgradePlanResponse> {
    return await callEdgeFunction<UpgradePlanResponse>(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.COMPLETE_UPGRADE,
      request
    );
  },

  /**
   * 기존 빌링키로 플랜 업그레이드 (카드가 이미 등록된 경우)
   */
  async upgradePlan(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    return await callEdgeFunction<UpgradePlanResponse>(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.UPGRADE,
      request
    );
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
    try {
      const response = await callEdgeFunction<{
        success: boolean;
        card: {
          type: string;
          company: string;
          number: string;
          createdAt: string;
        } | null;
      }>(EDGE_FUNCTION_ENDPOINTS.PAYMENT.GET_CARD, null, { method: 'GET' });

      if (response.success) {
        return response.card;
      }
      return null;
    } catch (error) {
      console.error('카드 정보 조회 실패:', error);
      return null;
    }
  },

  /**
   * 카드 정보 삭제 (Edge Function 호출 - 테스트용)
   */
  async deleteCard(): Promise<void> {
    await callEdgeFunction<{ success: boolean; message: string }>(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.DELETE_CARD,
      {}
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
    return await callEdgeFunction(
      EDGE_FUNCTION_ENDPOINTS.PAYMENT.PREVIEW_UPGRADE,
      { planId }
    );
  },

  /**
   * 플랜 변경 (업그레이드/다운그레이드)
   * - 업그레이드: 즉시 적용 + 할인
   * - 다운그레이드: 구독 종료 후 적용
   */
  async changePlan(planId: string): Promise<{
    type: 'upgrade' | 'downgrade';
    newPlan: string;
    discount?: number;
    finalAmount?: number;
    appliedAt?: string;
    effectiveAt?: string | null;
  }> {
    return await callEdgeFunction(EDGE_FUNCTION_ENDPOINTS.PAYMENT.CHANGE_PLAN, {
      planId,
    });
  },

  /**
   * 구독 해지 (구독 종료 후 FREE 전환)
   */
  async cancelSubscription(): Promise<{
    canceledPlan: string;
    effectiveAt: string | null;
  }> {
    return await callEdgeFunction(EDGE_FUNCTION_ENDPOINTS.PAYMENT.CANCEL, {});
  },

  /**
   * 구독 해지 취소 (예약된 다운그레이드/해지 취소)
   */
  async undoCancellation(): Promise<void> {
    await callEdgeFunction(EDGE_FUNCTION_ENDPOINTS.PAYMENT.CANCEL_UNDO, {});
  },
};
