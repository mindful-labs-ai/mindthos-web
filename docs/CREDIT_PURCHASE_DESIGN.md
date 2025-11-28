# Credit Purchase System Design

> 플랜 크레딧 + 추가 구매 크레딧 통합 관리 설계

## 📋 설계 개요

### 핵심 원칙

1. **플랜 크레딧**: 구독 플랜에 포함된 기본 크레딧 (월별 리셋)
2. **구매 크레딧**: 추가로 구매한 크레딧 (영구 또는 유효기간)
3. **사용 우선순위**: 플랜 크레딧 우선 사용 → 구매 크레딧 사용

---

## 🗄️ 테이블 구조

### 1. 기존 테이블 (변경 없음)

```sql
-- usage: 플랜 크레딧 사용량
CREATE TABLE usage (
  id uuid PRIMARY KEY,
  user_id bigint NOT NULL,
  plan_id uuid NOT NULL,
  total_usage integer DEFAULT 0,  -- 플랜 크레딧 사용량
  reset_at timestamptz,            -- 월별 리셋 시각
  UNIQUE(user_id, plan_id)
);

-- credit_log: 모든 크레딧 사용 내역
CREATE TABLE credit_log (
  id uuid PRIMARY KEY,
  user_id bigint NOT NULL,
  session_id uuid,
  use_type varchar(30),
  use_amount integer,
  credit_source varchar(20),       -- 'plan' 또는 'purchase'
  purchase_id uuid,                 -- 구매 크레딧 사용 시 참조
  feature_metadata jsonb,
  created_at timestamptz NOT NULL
);
```

### 2. 신규 테이블

```sql
-- credit_purchases: 크레딧 구매 내역
CREATE TABLE credit_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id bigint NOT NULL,
  credit_amount integer NOT NULL,           -- 구매한 총 크레딧
  remaining_credit integer NOT NULL,         -- 남은 크레딧
  price integer NOT NULL,                    -- 결제 금액 (원)
  payment_id uuid,                           -- payments 테이블 참조
  expires_at timestamptz,                    -- 유효기간 (NULL = 영구)
  purchased_at timestamptz NOT NULL DEFAULT now(),
  status varchar(20) DEFAULT 'active',       -- 'active', 'expired', 'refunded', 'depleted'
  refunded_at timestamptz,                   -- 환불 시각
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_credit_purchases_user_active
  ON credit_purchases (user_id, status, expires_at)
  WHERE status = 'active';

CREATE INDEX idx_credit_purchases_user_created
  ON credit_purchases (user_id, created_at DESC);

COMMENT ON TABLE credit_purchases IS '크레딧 추가 구매 내역';
COMMENT ON COLUMN credit_purchases.remaining_credit IS '남은 크레딧 (차감 시 업데이트)';
COMMENT ON COLUMN credit_purchases.status IS 'active: 사용가능, expired: 만료, refunded: 환불, depleted: 소진';
```

---

## 🔄 크레딧 차감 로직

### 사용 우선순위

```
1. 플랜 크레딧 (plan_credit - total_usage)
   ↓ 부족하면
2. 구매 크레딧 (구매 순서대로, FIFO)
   - 유효기간이 짧은 것부터 (expires_at ASC)
   - 또는 구매 순서대로 (purchased_at ASC)
```

### PostgreSQL 함수 (개선)

```sql
CREATE OR REPLACE FUNCTION public.deduct_credit_with_purchase(
  p_user_id bigint,
  p_credit_amount integer,
  p_use_type varchar,
  p_session_id uuid DEFAULT NULL,
  p_feature_metadata jsonb DEFAULT NULL,
  p_log_memo varchar DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_id uuid;
  v_current_usage integer;
  v_plan_credit integer;
  v_plan_remaining integer;
  v_plan_deduct integer := 0;
  v_purchase_deduct integer := 0;
  v_remaining_needed integer;
  v_purchase record;
BEGIN
  -- 1. 플랜 usage Lock
  SELECT u.id, u.total_usage, p.total_credit
  INTO v_usage_id, v_current_usage, v_plan_credit
  FROM usage u
  JOIN plans p ON u.plan_id = p.id
  WHERE u.user_id = p_user_id
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_PLAN_NOT_FOUND',
      'message', '사용자 플랜 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 플랜 크레딧 계산
  v_current_usage := COALESCE(v_current_usage, 0);
  v_plan_credit := COALESCE(v_plan_credit, 0);
  v_plan_remaining := v_plan_credit - v_current_usage;

  -- 3. 플랜 크레딧으로 충당 가능한지 확인
  IF v_plan_remaining >= p_credit_amount THEN
    -- 플랜 크레딧만으로 충분
    v_plan_deduct := p_credit_amount;

    UPDATE usage SET total_usage = v_current_usage + v_plan_deduct
    WHERE id = v_usage_id;

    INSERT INTO credit_log (user_id, session_id, use_type, use_amount,
                            credit_source, feature_metadata, log_memo, created_at)
    VALUES (p_user_id, p_session_id, p_use_type, v_plan_deduct,
            'plan', p_feature_metadata, p_log_memo, now());

  ELSE
    -- 플랜 크레딧 부족 → 구매 크레딧 사용
    v_plan_deduct := v_plan_remaining;
    v_remaining_needed := p_credit_amount - v_plan_deduct;

    -- 구매 크레딧 합계 확인
    SELECT COALESCE(SUM(remaining_credit), 0) INTO v_purchase_deduct
    FROM credit_purchases
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now());

    -- 총 크레딧 부족
    IF v_plan_remaining + v_purchase_deduct < p_credit_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INSUFFICIENT_CREDIT',
        'message', '크레딧이 부족합니다.',
        'required', p_credit_amount,
        'available', v_plan_remaining + v_purchase_deduct,
        'plan_credit', v_plan_remaining,
        'purchased_credit', v_purchase_deduct
      );
    END IF;

    -- 플랜 크레딧 차감
    IF v_plan_deduct > 0 THEN
      UPDATE usage SET total_usage = v_current_usage + v_plan_deduct
      WHERE id = v_usage_id;

      INSERT INTO credit_log (user_id, session_id, use_type, use_amount,
                              credit_source, feature_metadata, log_memo, created_at)
      VALUES (p_user_id, p_session_id, p_use_type, v_plan_deduct,
              'plan', p_feature_metadata, p_log_memo, now());
    END IF;

    -- 구매 크레딧 차감 (FIFO: 유효기간 순)
    FOR v_purchase IN
      SELECT id, remaining_credit
      FROM credit_purchases
      WHERE user_id = p_user_id
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY
        CASE WHEN expires_at IS NULL THEN '9999-12-31'::timestamptz ELSE expires_at END ASC,
        purchased_at ASC
      FOR UPDATE
    LOOP
      IF v_remaining_needed <= 0 THEN
        EXIT;
      END IF;

      IF v_purchase.remaining_credit >= v_remaining_needed THEN
        -- 이 구매건으로 충분
        UPDATE credit_purchases
        SET remaining_credit = remaining_credit - v_remaining_needed,
            status = CASE WHEN remaining_credit - v_remaining_needed = 0 THEN 'depleted' ELSE 'active' END
        WHERE id = v_purchase.id;

        INSERT INTO credit_log (user_id, session_id, use_type, use_amount,
                                credit_source, purchase_id, feature_metadata, log_memo, created_at)
        VALUES (p_user_id, p_session_id, p_use_type, v_remaining_needed,
                'purchase', v_purchase.id, p_feature_metadata, p_log_memo, now());

        v_purchase_deduct := v_purchase_deduct + v_remaining_needed;
        v_remaining_needed := 0;
      ELSE
        -- 이 구매건 전부 사용
        UPDATE credit_purchases
        SET remaining_credit = 0,
            status = 'depleted'
        WHERE id = v_purchase.id;

        INSERT INTO credit_log (user_id, session_id, use_type, use_amount,
                                credit_source, purchase_id, feature_metadata, log_memo, created_at)
        VALUES (p_user_id, p_session_id, p_use_type, v_purchase.remaining_credit,
                'purchase', v_purchase.id, p_feature_metadata, p_log_memo, now());

        v_purchase_deduct := v_purchase_deduct + v_purchase.remaining_credit;
        v_remaining_needed := v_remaining_needed - v_purchase.remaining_credit;
      END IF;
    END LOOP;
  END IF;

  -- 성공 응답
  RETURN jsonb_build_object(
    'success', true,
    'message', p_credit_amount || ' 크레딧이 차감되었습니다.',
    'deducted', jsonb_build_object(
      'total', p_credit_amount,
      'from_plan', v_plan_deduct,
      'from_purchase', p_credit_amount - v_plan_deduct
    ),
    'remaining', jsonb_build_object(
      'plan', v_plan_credit - (v_current_usage + v_plan_deduct),
      'purchased', (SELECT COALESCE(SUM(remaining_credit), 0)
                    FROM credit_purchases
                    WHERE user_id = p_user_id AND status = 'active')
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CREDIT_DEDUCTION_ERROR',
      'message', '크레딧 차감에 실패했습니다.',
      'details', SQLERRM
    );
END;
$$;
```

---

## 📊 크레딧 조회 함수

```sql
-- 사용자 총 크레딧 조회
CREATE OR REPLACE FUNCTION public.get_user_total_credit(p_user_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_total integer;
  v_plan_used integer;
  v_purchased_total integer;
BEGIN
  -- 플랜 크레딧
  SELECT p.total_credit, COALESCE(u.total_usage, 0)
  INTO v_plan_total, v_plan_used
  FROM usage u
  JOIN plans p ON u.plan_id = p.id
  WHERE u.user_id = p_user_id;

  -- 구매 크레딧 (활성 + 유효기간 내)
  SELECT COALESCE(SUM(remaining_credit), 0)
  INTO v_purchased_total
  FROM credit_purchases
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());

  RETURN jsonb_build_object(
    'plan', jsonb_build_object(
      'total', COALESCE(v_plan_total, 0),
      'used', v_plan_used,
      'remaining', COALESCE(v_plan_total, 0) - v_plan_used
    ),
    'purchased', jsonb_build_object(
      'total', v_purchased_total,
      'remaining', v_purchased_total
    ),
    'total_remaining', (COALESCE(v_plan_total, 0) - v_plan_used) + v_purchased_total
  );
END;
$$;
```

---

## 🛒 크레딧 구매 API

```typescript
// POST /functions/v1/credit-purchase

interface PurchaseCreditRequest {
  user_id: number;
  credit_amount: number; // 구매할 크레딧 (예: 100)
  price: number; // 결제 금액 (원)
  payment_id: string; // 결제 ID
  expires_days?: number; // 유효기간 (일), null = 영구
}

interface PurchaseCreditResponse {
  success: boolean;
  purchase_id: string;
  credit_amount: number;
  expires_at: string | null;
}
```

---

## 📈 장점 정리

### 비즈니스 관점

- ✅ 플랜 크레딧 부족 시 추가 구매 유도 가능
- ✅ 구매 내역 완벽 추적 (회계/정산)
- ✅ 환불 처리 명확
- ✅ 유효기간 설정 가능 (프로모션 크레딧 등)

### 기술 관점

- ✅ 동시성 안전 (Row-level Lock)
- ✅ 트랜잭션 보장 (플랜 + 구매 크레딧 원자적 차감)
- ✅ 확장성 (새로운 크레딧 소스 추가 가능)
- ✅ 로그 추적 (credit_source로 출처 구분)

---

## 🎯 구현 우선순위

1. **Phase 1**: credit_purchases 테이블 생성
2. **Phase 2**: deduct_credit_with_purchase 함수 구현
3. **Phase 3**: get_user_total_credit 함수 구현
4. **Phase 4**: 크레딧 구매 Edge Function 구현
5. **Phase 5**: 기존 deduct_credit_atomic을 deduct_credit_with_purchase로 교체

---

## 📝 마이그레이션 예시

```sql
-- 20251119000001_add_credit_purchases.sql

-- 1. credit_purchases 테이블 생성
CREATE TABLE credit_purchases (
  ...
);

-- 2. credit_log에 컬럼 추가
ALTER TABLE credit_log
  ADD COLUMN credit_source varchar(20) DEFAULT 'plan',
  ADD COLUMN purchase_id uuid;

COMMENT ON COLUMN credit_log.credit_source IS '크레딧 출처: plan (플랜), purchase (구매)';
COMMENT ON COLUMN credit_log.purchase_id IS '구매 크레딧 사용 시 credit_purchases.id 참조';

-- 3. 함수 생성
CREATE FUNCTION deduct_credit_with_purchase(...);
CREATE FUNCTION get_user_total_credit(...);
```
