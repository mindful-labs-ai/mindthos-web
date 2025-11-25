# Database Schema Documentation

> 이 문서는 Mindthos 데이터베이스의 최종 스키마를 정의합니다.
> SDD 프로세스에서 AI가 테이블 구조와 UI의 일관성을 유지하기 위한 참조 자료로 사용됩니다.

## 목차

1. [테이블 개요](#테이블-개요)
2. [핵심 테이블 상세](#핵심-테이블-상세)
3. [Edge Functions API](#edge-functions-api)

---

## 테이블 개요

### 핵심 테이블

| 테이블명       | 설명            | 주요 용도                |
| -------------- | --------------- | ------------------------ |
| users          | 사용자 (상담사) | 인증, 프로필 관리        |
| clients        | 내담자          | 상담 대상자 정보         |
| sessions       | 상담 세션       | 상담 회기 관리           |
| onboarding     | 온보딩          | 초기 설정 프로세스       |
| templates      | 템플릿          | 상담 기록 템플릿         |
| progress_notes | 경과 기록       | 세션별 상담 경과 요약    |
| transcribes    | 전사 기록       | 음성 전사 내용           |
| template_pin   | 템플릿 고정     | 사용자별 템플릿 즐겨찾기 |
| plans          | 요금제          | 서비스 플랜 정보         |
| subscribe      | 구독            | 사용자 구독 관리         |
| card           | 카드            | 결제 카드 정보           |
| payments       | 결제            | 결제 이력                |
| usage          | 사용량          | 크레딧 사용량 추적       |
| credit_log     | 크레딧 로그     | 크레딧 사용 내역         |

---

## 핵심 테이블 상세

### 1. users (사용자)

**설명:** 시스템 사용자 (상담사) 정보를 관리합니다. auth.users와 email로 연동됩니다.

| 컬럼                | 타입         | 제약     | 설명                               |
| ------------------- | ------------ | -------- | ---------------------------------- |
| id                  | bigint       | PK       | 사용자 고유 ID (시퀀스)            |
| name                | varchar(12)  |          | 이름 (최대 12자)                   |
| email               | varchar(320) | UNIQUE   | 이메일 (auth.users 연동)           |
| phone_number        | varchar(15)  |          | 전화번호                           |
| email_verified_at   | timestamptz  |          | 이메일 인증 시각                   |
| organization        | varchar(100) |          | 소속 기관                          |
| default_template_id | integer      |          | 기본 템플릿 ID (templates.id 참조) |
| created_at          | timestamptz  | NOT NULL | 생성 시각                          |
| updated_at          | timestamptz  | NOT NULL | 수정 시각                          |

**주요 특징:**

- id: users_id_seq 시퀀스로 자동 생성
- email: auth.users.email과 1:1 매핑 (트리거로 동기화)
- email_verified_at: null = 미인증, timestamptz = 인증 완료
- default_template_id: 사용자가 기본으로 사용할 템플릿 (선택)

---

### 2. clients (내담자)

**설명:** 상담 대상자 정보를 관리합니다. 각 내담자는 UUID로 고유하게 식별됩니다.

| 컬럼           | 타입         | 제약     | 설명                           |
| -------------- | ------------ | -------- | ------------------------------ |
| id             | uuid         | PK       | 내담자 고유 ID (UUID)          |
| counselor_id   | bigint       | NOT NULL | 담당 상담사 ID (users.id 참조) |
| name           | varchar(12)  | NOT NULL | 이름 (필수)                    |
| phone_number   | varchar(15)  |          | 전화번호                       |
| email          | varchar(320) |          | 이메일                         |
| counsel_theme  | varchar(100) |          | 상담 주제                      |
| counsel_number | smallint     |          | 회기 수                        |
| counsel_done   | boolean      |          | 상담 종결 여부 (default: false)|
| memo           | varchar(200) |          | 메모 (동반인 정보 등)          |
| pin            | boolean      |          | 고정 여부                      |
| created_at     | timestamptz  | NOT NULL | 생성 시각 (default: now())     |
| updated_at     | timestamptz  | NOT NULL | 수정 시각 (default: now())     |

**주요 특징:**

- id: UUID 자동 생성 (gen_random_uuid())
- memo: 동반인 정보를 텍스트로 저장
- counsel_theme: UI에서 상담 주제 표시용
- counsel_done: 상담 종결 상태 (false: 진행 중, true: 종결)

**변경 이력:**

- ~~group_id~~ 제거됨 (동반인은 memo로 관리)
- id bigint → uuid 변경

---

### 3. sessions (상담 세션)

**설명:** 상담 회기 정보를 관리합니다. 각 세션은 한 명의 내담자와 연결됩니다.

| 컬럼            | 타입         | 제약     | 설명                        |
| --------------- | ------------ | -------- | --------------------------- |
| id              | uuid         | PK       | 세션 고유 ID                |
| user_id         | bigint       | NOT NULL | 상담사 ID (users.id 참조)   |
| client_id       | uuid         |          | 내담자 ID (clients.id 참조) |
| title           | varchar(18)  |          | 세션 제목                   |
| description     | varchar(200) |          | 세션 설명                   |
| audio_meta_data | jsonb        |          | 음성 메타데이터             |
| created_at      | timestamptz  | NOT NULL | 생성 시각                   |

**관계:**

- user_id → users.id (상담사)
- client_id → clients.id (내담자)

**변경 이력:**

- ~~group_id~~ → client_id로 변경

---

### 4. onboarding (온보딩)

**설명:** 사용자의 초기 설정 프로세스를 관리합니다.

| 컬럼         | 타입             | 제약             | 설명                                      |
| ------------ | ---------------- | ---------------- | ----------------------------------------- |
| id           | uuid             | PK               | 온보딩 ID                                 |
| user_id      | bigint           | NOT NULL, UNIQUE | 사용자 ID (users.id 참조)                 |
| step         | smallint         |                  | 현재 단계 (0-3)                           |
| state        | onboarding_state | NOT NULL         | 상태 ENUM (pending/in_progress/completed) |
| completed_at | timestamptz      |                  | 완료 시각                                 |

**주요 특징:**

- user_id: UNIQUE 제약으로 사용자당 1개의 온보딩 레코드만 존재
- state: onboarding_state ENUM 타입 ('pending', 'in_progress', 'completed')

**온보딩 플로우:**

1. Step 0: 기본 정보 저장 (name, phone_number, organization)
   - State: pending → in_progress
2. Step 3: 온보딩 완료
   - State: in_progress → completed

---

### 5. templates (템플릿)

**설명:** 상담 기록 작성을 위한 공용 템플릿을 관리합니다.

| 컬럼        | 타입         | 제약     | 설명                |
| ----------- | ------------ | -------- | ------------------- |
| id          | integer      | PK       | 템플릿 ID (시퀀스)  |
| title       | varchar(24)  |          | 템플릿 제목 (24자)  |
| description | varchar(200) |          | 템플릿 설명 (200자) |
| prompt      | text         |          | AI 프롬프트 내용    |
| created_at  | timestamptz  | NOT NULL | 생성 시각           |

**주요 특징:**

- id: IDENTITY로 자동 생성 (GENERATED BY DEFAULT AS IDENTITY)
- user_id 없음: 모든 사용자가 공용으로 사용하는 템플릿
- prompt: AI 상담 기록 생성을 위한 프롬프트

---

### 6. progress_notes (경과 기록)

**설명:** 세션별 상담 경과 기록을 관리합니다.

| 컬럼        | 타입        | 제약     | 설명                          |
| ----------- | ----------- | -------- | ----------------------------- |
| id          | uuid        | PK       | 상담 기록 ID                  |
| session_id  | uuid        | NOT NULL | 세션 ID (sessions.id 참조)    |
| user_id     | bigint      | NOT NULL | 상담사 ID (users.id 참조)     |
| title       | varchar(18) |          | 기록 제목 (18자)              |
| template_id | integer     |          | 템플릿 ID (templates.id 참조) |
| summary     | text        |          | 상담 요약 내용                |
| created_at  | timestamptz | NOT NULL | 생성 시각                     |

**주요 특징:**

- summary: AI가 생성한 상담 요약 내용
- template_id: 사용된 템플릿 (선택)

---

### 7. transcribes (전사 기록)

**설명:** 상담 세션의 음성 전사 내용을 관리합니다.

| 컬럼         | 타입        | 제약     | 설명                       |
| ------------ | ----------- | -------- | -------------------------- |
| id           | uuid        | PK       | 전사 ID                    |
| session_id   | uuid        | NOT NULL | 세션 ID (sessions.id 참조) |
| user_id      | bigint      | NOT NULL | 상담사 ID (users.id 참조)  |
| title        | varchar(18) |          | 전사 제목 (18자)           |
| counsel_date | date        |          | 상담 일자                  |
| contents     | text        |          | 전사 내용                  |
| created_at   | timestamptz | NOT NULL | 생성 시각                  |

**주요 특징:**

- contents: 음성을 텍스트로 변환한 전사 내용
- counsel_date: 실제 상담이 진행된 날짜

---

### 8. template_pin (템플릿 고정)

**설명:** 사용자별 템플릿 즐겨찾기 기능을 관리합니다.

| 컬럼        | 타입    | 제약     | 설명                          |
| ----------- | ------- | -------- | ----------------------------- |
| id          | uuid    | PK       | 고정 ID                       |
| template_id | integer | NOT NULL | 템플릿 ID (templates.id 참조) |
| user_id     | bigint  | NOT NULL | 사용자 ID (users.id 참조)     |

**주요 특징:**

- UNIQUE(user_id, template_id): 동일 사용자가 같은 템플릿을 중복 고정할 수 없음

---

### 9. plans (요금제)

**설명:** 서비스 요금제 정보를 관리합니다.

| 컬럼         | 타입        | 제약   | 설명             |
| ------------ | ----------- | ------ | ---------------- |
| id           | uuid        | PK     | 플랜 ID          |
| type         | varchar(15) | UNIQUE | 플랜 타입 (고유) |
| description  | varchar(50) |        | 플랜 설명 (50자) |
| price        | integer     |        | 가격             |
| total_credit | integer     |        | 총 크레딧        |

**주요 특징:**

- type: 플랜 타입으로 고유 식별 (예: 'basic', 'pro', 'enterprise')
- total_credit: 플랜별 제공되는 통합 크레딧 (음성 전사, 요약 생성 등 모든 기능에 공통 사용)

---

### 10. subscribe (구독)

**설명:** 사용자의 요금제 구독 정보를 관리합니다.

| 컬럼         | 타입        | 제약     | 설명                      |
| ------------ | ----------- | -------- | ------------------------- |
| id           | uuid        | PK       | 구독 ID                   |
| user_id      | bigint      | NOT NULL | 사용자 ID (users.id 참조) |
| plan_id      | uuid        | NOT NULL | 플랜 ID (plans.id 참조)   |
| billing_key  | text        |          | 결제 키                   |
| start_at     | timestamptz |          | 구독 시작 시각            |
| end_at       | timestamptz |          | 구독 종료 시각            |
| last_paid_at | timestamptz |          | 최근 결제 시각            |
| is_canceled  | boolean     |          | 구독 취소 여부            |

---

### 11. card (카드)

**설명:** 사용자의 결제 카드 정보를 관리합니다.

| 컬럼       | 타입        | 제약     | 설명                       |
| ---------- | ----------- | -------- | -------------------------- |
| id         | uuid        | PK       | 카드 ID                    |
| user_id    | bigint      | NOT NULL | 사용자 ID (users.id 참조)  |
| type       | card_type   |          | 카드 타입 ENUM (신용/체크) |
| company    | varchar(6)  |          | 카드사 (6자)               |
| number     | varchar(16) |          | 카드 번호 (16자)           |
| created_at | timestamptz | NOT NULL | 생성 시각                  |

**주요 특징:**

- type: card_type ENUM ('신용', '체크')

---

### 12. payments (결제)

**설명:** 결제 이력을 관리합니다.

| 컬럼       | 타입           | 제약     | 설명                      |
| ---------- | -------------- | -------- | ------------------------- |
| id         | uuid           | PK       | 결제 ID                   |
| user_id    | bigint         | NOT NULL | 사용자 ID (users.id 참조) |
| plan_id    | uuid           | NOT NULL | 플랜 ID (plans.id 참조)   |
| expired_at | timestamptz    |          | 만료 시각                 |
| status     | payment_status |          | 결제 상태 ENUM            |
| created_at | timestamptz    | NOT NULL | 생성 시각                 |

**주요 특징:**

- status: payment_status ENUM ('in_progress', 'success', 'failed')

---

### 13. usage (사용량)

**설명:** 플랜별 크레딧 사용량을 관리합니다.

| 컬럼        | 타입        | 제약     | 설명                      |
| ----------- | ----------- | -------- | ------------------------- |
| id          | uuid        | PK       | 사용량 ID                 |
| user_id     | bigint      | NOT NULL | 사용자 ID (users.id 참조) |
| plan_id     | uuid        | NOT NULL | 플랜 ID (plans.id 참조)   |
| total_usage | integer     |          | 총 크레딧 사용량          |
| reset_at    | timestamptz |          | 사용량 리셋 시각          |

**주요 특징:**

- UNIQUE(user_id, plan_id): 사용자별 플랜별 1개의 레코드만 존재
- total_usage: 모든 기능(음성 전사, 요약 생성 등)의 통합 사용량

---

### 14. credit_log (크레딧 로그)

**설명:** 크레딧 사용 내역을 기록합니다.

| 컬럼             | 타입        | 제약     | 설명                      |
| ---------------- | ----------- | -------- | ------------------------- |
| id               | uuid        | PK       | 로그 ID                   |
| user_id          | bigint      | NOT NULL | 사용자 ID (users.id 참조) |
| use_type         | varchar(30) |          | 사용 타입 (30자)          |
| use_amount       | integer     |          | 사용량                    |
| feature_metadata | jsonb       |          | 기능별 메타데이터         |
| log_memo         | varchar(50) |          | 로그 메모 (50자)          |
| created_at       | timestamptz | NOT NULL | 생성 시각                 |

**주요 특징:**

- use_type: 기능 타입 (예: 'audio_transcribe', 'summary_generate', 'template_ai_generate')
- feature_metadata: 기능별 상세 정보를 JSONB로 저장 (모든 메타데이터 통합 관리)
  - 음성 전사: `{"session_id": "uuid", "duration_seconds": 185, "file_size_mb": 12.5}`
  - 요약 생성: `{"session_id": "uuid", "text_length": 5000, "summary_type": "detailed"}`
  - 템플릿 AI 생성: `{"template_count": 5, "prompt_tokens": 1500}`
  - 대시보드 분석: `{"analysis_type": "monthly_report", "data_range_days": 30}`
- GIN 인덱스로 JSONB 검색 성능 최적화

---

## Edge Functions API

### POST /auth/check-user-exists

이메일 중복 확인 (인증된 사용자만 중복으로 간주)

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "exists": false,
  "message": "사용 가능한 이메일입니다."
}
```

**Response (400 - 중복):**

```json
{
  "success": false,
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "이미 사용 중인 이메일입니다."
}
```

---

### POST /onboarding/status

온보딩 상태 조회

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "step": 0,
  "state": "in_progress"
}
```

---

### POST /onboarding/save

기본 정보 저장

**Request:**

```json
{
  "email": "user@example.com",
  "name": "홍길동",
  "phone_number": "010-1234-5678",
  "organization": "마인드토스"
}
```

**Response:**

```json
{
  "success": true,
  "message": "기본 정보가 저장되었습니다.",
  "step": 0,
  "state": "in_progress"
}
```

---

### POST /onboarding/complete

온보딩 완료

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "온보딩이 완료되었습니다.",
  "step": 3,
  "state": "completed"
}
```

---

### POST /clients/create

내담자 등록

**Request:**

```json
{
  "counselor_email": "counselor@example.com",
  "name": "홍길동",
  "phone_number": "010-1234-5678",
  "email": "client@example.com",
  "counsel_theme": "친구 관계",
  "memo": "동반인: 김철수, 이영희",
  "counsel_number": 15
}
```

**Response:**

```json
{
  "success": true,
  "message": "내담자가 등록되었습니다.",
  "client": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "홍길동"
  }
}
```

**필수 필드:**

- counselor_email (상담사 이메일)
- name (내담자 이름)

**선택 필드:**

- phone_number
- email
- counsel_theme (상담 주제)
- memo (메모, 동반인 정보 등)
- counsel_number (회기 수)

---

## 제약사항 및 규칙

### Foreign Key 정책

- 모든 FK 제거됨: 애플리케이션 레벨에서 참조 무결성 관리

### 문자열 길이 제한

- name: 12자
- phone_number: 15자
- email: 320자
- memo: 200자
- counsel_theme: 100자

### 동기화 규칙

- auth.users ↔ public.users: email 기반 동기화
- auth.users.email_confirmed_at → public.users.email_verified_at: 트리거로 실시간 동기화

---

## ENUM 타입 정의

| ENUM 타입        | 값                                    | 사용 테이블 |
| ---------------- | ------------------------------------- | ----------- |
| onboarding_state | 'pending', 'in_progress', 'completed' | onboarding  |
| payment_status   | 'in_progress', 'success', 'failed'    | payments    |
| card_type        | '신용', '체크'                        | card        |

---

## 변경 이력

### v1.9 (2025-11-18)

- **중요 변경:** 통합 크레딧 시스템 도입
- plans: `audio_credit`, `summary_credit` → `total_credit` 통합
- usage: `audio_usage`, `summary_usage` → `total_usage` 통합
- credit_log: `session_id`, `subscribe_id` 제거 → `feature_metadata`로 통합
- credit_log: `feature_metadata` 컬럼 추가 (모든 메타데이터를 JSONB로 통합 관리)
- credit_log: `use_type` 길이 8자 → 30자 확장
- credit_log: GIN 인덱스 추가 (JSONB 검색 성능 최적화)
- Row-level lock 기반 동시성 안전 크레딧 차감 함수 추가 (`deduct_credit_atomic`)
- Credit Manager Edge Function 구현 (통합 크레딧 관리 API)

### v1.8 (2025-11-18)

- clients.counsel_done 추가 (상담 종결 여부)
- user 헬퍼 함수 업데이트 (email_verified_at, organization, default_template_id 추가)

### v1.7 (2025-11-18)

- **중요 변경:** templates.id 시퀀스 → IDENTITY 변경 (타입 안정성 향상)
- 시퀀스 관리 불필요, SQL 표준 방식 적용

### v1.6 (2025-11-18)

- **중요 변경:** counsel_notes → progress_notes 테이블명 변경
- **중요 변경:** templates.id uuid → integer 변경 (운영자 관리 편의성 향상)
- **중요 변경:** template_id 참조 컬럼 모두 integer로 변경
- 기존 templates 데이터 삭제 및 초기화

### v1.5 (2025-11-18)

- users.default_template_id 추가 (사용자 기본 템플릿 설정)

### v1.4 (2025-11-18)

- **문서 수정:** 실제 데이터베이스 스키마에 맞춰 SCHEMA 전면 수정
- ENUM 타입 정확히 반영 (onboarding_state, payment_status, card_type)
- 전체 14개 테이블 상세 문서화 (기존 4개에서 확장)
- templates, progress_notes, transcribes, template_pin, plans, subscribe, card, payments, usage, credit_log 추가
- 각 테이블의 실제 컬럼 및 제약사항 정확히 반영

### v1.3 (2025-11-18)

- clients.counsel_theme 추가 (상담 주제)
- Edge Functions API 문서화

### v1.2 (2025-11-18)

- clients.id: bigint → uuid 변경
- clients.group_id 제거 (동반인은 memo로 관리)
- sessions.group_id → sessions.client_id 변경

### v1.1 (2025-11-14)

- users.email_verified_at 추가
- users.organization 추가
- clients.email 추가
