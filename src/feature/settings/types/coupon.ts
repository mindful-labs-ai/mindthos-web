/** API 응답의 쿠폰 아이템 */
export interface CouponResponse {
  user_coupon_id: string;
  coupon_id: string;
  title: string;
  discount: number;
  expired_at: string;
  valid: boolean;
  reason?: CouponInvalidReason;
}

/** 쿠폰 검증 실패 사유 */
export type CouponInvalidReason =
  | 'ALREADY_USED'
  | 'EXPIRED'
  | 'INVALID_PLAN_TYPE'
  | 'HAS_PREVIOUS_PAYMENT'
  | 'COUPON_NOT_OWNED'
  | 'COUPON_NOT_FOUND'
  | 'VALIDATOR_NOT_FOUND';

/** 전체 쿠폰 검증 API 응답 */
export interface ValidateCouponsResponse {
  success: boolean;
  coupons: CouponResponse[];
}

/** 단건 쿠폰 검증 API 응답 */
export interface ValidateCouponResponse {
  success: boolean;
  user_coupon_id: string;
  coupon_id: string;
  title: string;
  discount: number;
  expired_at: string;
  valid: boolean;
  reason?: CouponInvalidReason;
}

/** 쿠폰 등록 API 응답 */
export interface RegisterCouponResponse {
  success: boolean;
  message: string;
  coupon_id: string;
  title: string;
  discount: number;
  expired_at: string;
}

/** 쿠폰 등록 실패 API 응답 */
export interface RegisterCouponErrorResponse {
  success: false;
  error: string;
  message: string;
}

/** 클라이언트에서 사용하는 쿠폰 모델 */
export interface Coupon {
  /** user_coupon_id - 유저별 고유 식별자 (같은 쿠폰 2개 보유 가능) */
  id: string;
  /** 쿠폰 코드 (FIRST2026 등) */
  couponId: string;
  title: string;
  discount: number;
  expiresAt: string;
  valid: boolean;
  reason?: CouponInvalidReason;
}
