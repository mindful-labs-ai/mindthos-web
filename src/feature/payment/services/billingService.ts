import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/shared/utils/edgeFunctionClient';

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
      '/payment/issue-billing-key',
      request
    );
  },

  /**
   * 플랜 업그레이드 초기화 (payments row 생성)
   */
  async initUpgrade(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    return await callEdgeFunction<UpgradePlanResponse>(
      '/payment/init-upgrade',
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
      '/payment/complete-upgrade',
      request
    );
  },

  /**
   * 기존 빌링키로 플랜 업그레이드 (카드가 이미 등록된 경우)
   */
  async upgradePlan(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    return await callEdgeFunction<UpgradePlanResponse>(
      '/payment/upgrade',
      request
    );
  },

  /**
   * 사용자의 최신 구독 정보 조회
   * subscribe 테이블은 1:N 관계로 히스토리를 관리하므로 last_paid_at 기준 최신 레코드 조회
   * - 새로운 구독/재결제 시마다 새 row 추가
   * - last_paid_at: 실질적인 결제일(생성일)
   * - start_at: 최초 구독 시작일 (재결제 시 다음 결제일 계산 기준)
   * - end_at: 구독 만료일
   * - billing_key는 card 테이블에서 관리됨
   */
  async getSubscription(userId: number) {
    const { data, error } = await supabase
      .from('subscribe')
      .select(
        'id, user_id, plan_id, start_at, end_at, last_paid_at, is_canceled'
      )
      .eq('user_id', userId)
      .order('last_paid_at', { ascending: false })
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
  async getCard(userId: number) {
    const { data, error } = await supabase
      .from('card')
      .select('id, user_id, type, company, number, created_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`카드 정보 조회 실패: ${error.message}`);
    }

    return data;
  },

  /**
   * 카드 정보 삭제 (Edge Function 호출 - 테스트용)
   */
  async deleteCard(): Promise<void> {
    await callEdgeFunction<{ success: boolean; message: string }>(
      '/payment/delete-card',
      {}
    );
  },
};
