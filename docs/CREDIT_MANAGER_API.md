# Credit Manager API

> 통합 크레딧 차감 및 관리 Edge Function
>
> 모든 기능(음성 전사, 요약 생성 등)에서 공통으로 사용하는 크레딧 관리 API입니다.

## 📋 목차

1. [Endpoint](#endpoint)
2. [Request](#request)
3. [Response](#response)
4. [Error Codes](#error-codes)
5. [Usage Examples](#usage-examples)
6. [Important Notes](#important-notes)

---

## Endpoint

```
POST /functions/v1/credit-manager
```

**Base URL:**

```
https://[your-project-ref].supabase.co/functions/v1/credit-manager
```

---

## Request

### Headers

```http
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY]
```

### Request Body

| 필드               | 타입     | 필수 | 설명                                                   |
| ------------------ | -------- | ---- | ------------------------------------------------------ |
| `user_id`          | `number` | ✅   | 사용자 ID (public.users.id)                            |
| `credit_amount`    | `number` | ✅   | 차감할 크레딧 (양수)                                   |
| `use_type`         | `string` | ✅   | 기능 타입 (예: `audio_transcribe`, `summary_generate`) |
| `feature_metadata` | `object` | ❌   | 기능별 메타데이터 (선택, session_id 포함)              |
| `log_memo`         | `string` | ❌   | 로그 메모 (선택, 기본값: `{use_type} 사용`)            |

### Request Body Schema

```typescript
interface DeductCreditRequest {
  user_id: number;
  credit_amount: number;
  use_type: string;
  feature_metadata?: {
    session_id?: string; // 세션 관련 기능: 세션 ID
    duration_seconds?: number; // 음성 전사: 음성 길이 (초)
    file_size_mb?: number; // 음성 전사: 파일 크기 (MB)
    text_length?: number; // 요약 생성: 텍스트 길이
    template_count?: number; // 템플릿 AI 생성: 생성 개수
    analysis_type?: string; // 대시보드 분석: 분석 타입
    [key: string]: any; // 기타 커스텀 데이터
  };
  log_memo?: string;
}
```

### Example Request

```json
{
  "user_id": 123,
  "credit_amount": 4,
  "use_type": "audio_transcribe",
  "feature_metadata": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "duration_seconds": 185,
    "file_size_mb": 12.5,
    "calculated_cost": 4
  },
  "log_memo": "음성 전사 4분"
}
```

---

## Response

### Success Response (200 OK)

```typescript
interface DeductCreditResponse {
  success: true;
  remaining_credit: number; // 남은 크레딧
  message: string; // 성공 메시지
  total_credit: number; // 플랜 총 크레딧
  used_credit: number; // 사용한 총 크레딧
}
```

#### Example

```json
{
  "success": true,
  "remaining_credit": 96,
  "message": "4 크레딧이 차감되었습니다.",
  "total_credit": 100,
  "used_credit": 4
}
```

---

### Error Responses

#### 1. 입력 검증 실패 (400 Bad Request)

**원인:** 필수 필드 누락 또는 잘못된 값

```json
{
  "success": false,
  "error": "MISSING_REQUIRED_FIELDS",
  "message": "user_id, credit_amount, use_type은 필수입니다."
}
```

```json
{
  "success": false,
  "error": "INVALID_CREDIT_AMOUNT",
  "message": "credit_amount는 0보다 커야 합니다."
}
```

---

#### 2. 크레딧 부족 (402 Payment Required)

**원인:** 남은 크레딧이 요청한 크레딧보다 적음

```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDIT",
  "message": "크레딧이 부족합니다.",
  "required": 10,
  "available": 5,
  "remaining_credit": 5
}
```

**필드 설명:**

- `required`: 필요한 크레딧
- `available`: 사용 가능한 크레딧
- `remaining_credit`: 현재 남은 크레딧

---

#### 3. 사용자 플랜 없음 (404 Not Found)

**원인:** 사용자의 플랜 정보가 없음

```json
{
  "success": false,
  "error": "USER_PLAN_NOT_FOUND",
  "message": "사용자 플랜 정보를 찾을 수 없습니다."
}
```

---

#### 4. 메서드 오류 (405 Method Not Allowed)

**원인:** POST 외의 메서드 사용

```json
{
  "success": false,
  "error": "METHOD_NOT_ALLOWED",
  "message": "POST 메서드만 지원합니다."
}
```

---

#### 5. 서버 오류 (500 Internal Server Error)

**원인:** 크레딧 차감 중 오류 발생

```json
{
  "success": false,
  "error": "CREDIT_DEDUCTION_ERROR",
  "message": "크레딧 차감에 실패했습니다."
}
```

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  "details": "RPC error: ..."
}
```

---

## Error Codes

| HTTP Status | Error Code                | 설명                |
| ----------- | ------------------------- | ------------------- |
| 400         | `MISSING_REQUIRED_FIELDS` | 필수 필드 누락      |
| 400         | `INVALID_CREDIT_AMOUNT`   | 크레딧 값이 0 이하  |
| 402         | `INSUFFICIENT_CREDIT`     | 크레딧 부족         |
| 404         | `USER_PLAN_NOT_FOUND`     | 사용자 플랜 없음    |
| 405         | `METHOD_NOT_ALLOWED`      | POST 외 메서드 사용 |
| 500         | `CREDIT_DEDUCTION_ERROR`  | 크레딧 차감 실패    |
| 500         | `INTERNAL_SERVER_ERROR`   | 서버 오류           |

---

## Usage Examples

### TypeScript/JavaScript

#### 1. 기본 사용 (음성 전사)

```typescript
async function deductAudioCredit(
  userId: number,
  durationSeconds: number
): Promise<{ success: boolean; remainingCredit: number }> {
  // 크레딧 계산 (1분당 1크레딧)
  const creditAmount = Math.ceil(durationSeconds / 60);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/credit-manager`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      user_id: userId,
      credit_amount: creditAmount,
      use_type: "audio_transcribe",
      feature_metadata: {
        session_id: "optional-session-uuid", // 세션 관련 기능인 경우
        duration_seconds: durationSeconds,
        calculated_cost: creditAmount,
      },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    if (result.error === "INSUFFICIENT_CREDIT") {
      throw new Error(
        `크레딧 부족: ${result.required}크레딧 필요, ${result.available}크레딧 보유`
      );
    }
    throw new Error(result.message);
  }

  return {
    success: true,
    remainingCredit: result.remaining_credit,
  };
}
```

#### 2. 에러 처리 포함

```typescript
async function deductCredit(params: {
  userId: number;
  creditAmount: number;
  useType: string;
  metadata?: Record<string, any>;
}) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/credit-manager`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: params.userId,
          credit_amount: params.creditAmount,
          use_type: params.useType,
          feature_metadata: params.metadata, // session_id는 여기에 포함
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // HTTP 에러 처리
      switch (response.status) {
        case 402:
          return {
            success: false,
            error: "INSUFFICIENT_CREDIT",
            message: result.message,
            required: result.required,
            available: result.available,
          };
        case 404:
          return {
            success: false,
            error: "USER_PLAN_NOT_FOUND",
            message: result.message,
          };
        default:
          return {
            success: false,
            error: result.error || "UNKNOWN_ERROR",
            message: result.message || "알 수 없는 오류",
          };
      }
    }

    return result;
  } catch (error) {
    console.error("Credit deduction error:", error);
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: "네트워크 오류가 발생했습니다.",
    };
  }
}
```

#### 3. Edge Function에서 사용

```typescript
// audio-transcribe/index.ts
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const { audioFile, userId, sessionId } = await req.json();

  // 1. 크레딧 계산
  const durationSeconds = audioFile.duration;
  const creditAmount = Math.ceil(durationSeconds / 60);

  // 2. Credit Manager 호출
  const creditResponse = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/credit-manager`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        user_id: userId,
        credit_amount: creditAmount,
        use_type: "audio_transcribe",
        feature_metadata: {
          session_id: sessionId, // 세션 ID를 메타데이터에 포함
          duration_seconds: durationSeconds,
          file_size_mb: audioFile.size / 1024 / 1024,
        },
      }),
    }
  );

  const creditResult = await creditResponse.json();

  // 3. 크레딧 부족 시 에러 반환
  if (!creditResult.success) {
    return new Response(JSON.stringify(creditResult), {
      status: creditResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. 크레딧 차감 성공 → 음성 전사 실행
  const transcription = await transcribeAudio(audioFile);

  return new Response(
    JSON.stringify({
      success: true,
      transcription,
      credit_used: creditAmount,
      remaining_credit: creditResult.remaining_credit,
    }),
    { status: 200 }
  );
});
```

---

## Important Notes

### 🔒 동시성 안전

- **Row-level Lock** 사용으로 동시 요청 시 데이터 일관성 보장
- 같은 사용자의 동시 요청은 순차적으로 처리 (FIFO)
- 다른 사용자의 요청은 병렬 처리 가능

### 💡 트랜잭션 보장

- 크레딧 차감과 로그 기록이 원자적으로 처리
- 하나라도 실패하면 전체 롤백

### ⚡ 성능 최적화

- PostgreSQL Function으로 DB 내부에서 처리
- 네트워크 왕복 최소화 (1회 RPC 호출)

### 📊 크레딧 계산

- **Edge Function에서 계산** 후 `credit_amount`로 전달

### 🚨 에러 처리 권장사항

1. **크레딧 부족 (402)**: 사용자에게 충전 안내
2. **플랜 없음 (404)**: 플랜 가입 유도
3. **서버 오류 (500)**: 재시도 또는 고객센터 안내

### 📝 로그 추적

- `credit_log` 테이블에 모든 사용 내역 기록
- `feature_metadata`로 상세 정보 저장
- 사용 패턴 분석 및 디버깅에 활용

---

## Changelog

### v1.1.0 (2025-11-18)

- **중요 변경:** `session_id` 파라미터 제거 → `feature_metadata`로 통합
- 모든 메타데이터를 JSONB로 통합 관리하여 유연성 향상
- 세션 무관 기능 (템플릿 AI 생성, 대시보드 분석 등) 지원 개선

### v1.0.0 (2025-11-18)

- 초기 릴리스
- 통합 크레딧 시스템 도입
- Row-level Lock으로 동시성 보장
- PostgreSQL Function으로 성능 최적화
