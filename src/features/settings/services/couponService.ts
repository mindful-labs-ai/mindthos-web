import { serverRequest } from '@/shared/api/server/serverClient';

import type {
  Coupon,
  CouponResponse,
  RegisterCouponResponse,
  ValidateCouponsResponse,
} from '../types/coupon';

/** API 응답을 내담자 모델로 변환 */
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
    const query = planType ? `?plan_type=${encodeURIComponent(planType)}` : '';
    const endpoint = `/coupons/validate${query}`;

    const data = await serverRequest<ValidateCouponsResponse>(endpoint);

    return data.coupons.map(toCoupon);
  },

  /** 쿠폰 등록 */
  async register(couponId: string): Promise<RegisterCouponResponse> {
    return await serverRequest<RegisterCouponResponse>('/coupons/register', {
      method: 'POST',
      body: { coupon_id: couponId },
    });
  },
};
