import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

import type {
  Coupon,
  CouponResponse,
  RegisterCouponResponse,
  ValidateCouponsResponse,
} from '../types/coupon';

/** API 응답을 클라이언트 모델로 변환 */
function toCoupon(response: CouponResponse): Coupon {
  return {
    id: response.user_coupon_id,
    couponId: response.coupon_id,
    title: response.title,
    discount: response.discount,
    expiresAt: response.expired_at,
    valid: response.valid,
    reason: response.reason,
  };
}

export const couponService = {
  /** 유저의 전체 쿠폰 검증 */
  async validateAll(planType?: string): Promise<Coupon[]> {
    const query = planType ? `?plan_type=${planType}` : '';
    const endpoint = `${EDGE_FUNCTION_ENDPOINTS.COUPONS.VALIDATE_ALL}${query}`;

    const data = await callEdgeFunction<ValidateCouponsResponse>(
      endpoint,
      undefined,
      { method: 'GET' }
    );

    return data.coupons.map(toCoupon);
  },

  /** 쿠폰 등록 */
  async register(couponId: string): Promise<RegisterCouponResponse> {
    return await callEdgeFunction<RegisterCouponResponse>(
      EDGE_FUNCTION_ENDPOINTS.COUPONS.REGISTER,
      { coupon_id: couponId }
    );
  },
};
