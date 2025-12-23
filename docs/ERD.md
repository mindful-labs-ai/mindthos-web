# Entity Relationship Diagram (ERD)

> Mindthos 데이터베이스의 엔티티 관계도입니다. 테이블 간 관계와 데이터 흐름을
> 시각화합니다.

## Mermaid ERD

```mermaid
erDiagram
    USERS ||--o{ CLIENTS : "counsels"
    USERS ||--o{ SESSIONS : "conducts"
    USERS ||--o{ ONBOARDING : "has"
    USERS ||--o{ PROGRESS_NOTES : "writes"
    USERS ||--o{ TRANSCRIBES : "creates"
    USERS ||--o{ TEMPLATE_PIN : "pins"
    USERS ||--o{ SUBSCRIBE : "subscribes"
    USERS ||--o{ CARD : "owns"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ USAGE : "tracks"
    USERS ||--o{ CREDIT_LOG : "logs"

    CLIENTS ||--o{ SESSIONS : "participates"

    SESSIONS ||--o{ PROGRESS_NOTES : "documented"
    SESSIONS ||--o{ TRANSCRIBES : "transcribed"

    TEMPLATES ||--o{ TEMPLATE_PIN : "pinned"
    TEMPLATES ||--o{ PROGRESS_NOTES : "uses"
    TEMPLATES ||--o{ USERS : "default_template"

    PLANS ||--o{ SUBSCRIBE : "offers"
    PLANS ||--o{ PAYMENTS : "billed"
    PLANS ||--o{ USAGE : "tracks"

    USERS {
        bigint id PK "시퀀스"
        varchar name "이름(12)"
        varchar email UK "이메일(320)"
        varchar phone_number "전화번호(15)"
        timestamptz email_verified_at "인증시각"
        varchar organization "소속(100)"
        integer default_template_id FK "기본템플릿"
        timestamptz created_at
        timestamptz updated_at
    }

    CLIENTS {
        uuid id PK "UUID"
        bigint counselor_id FK "상담사(필수)"
        varchar name "이름(12,필수)"
        varchar phone_number "전화번호(15)"
        varchar email "이메일(320)"
        varchar counsel_theme "상담주제(100)"
        smallint counsel_number "회기수"
        boolean counsel_done "상담종결"
        varchar memo "메모(200)"
        boolean pin "고정"
        timestamptz created_at
        timestamptz updated_at
    }

    SESSIONS {
        uuid id PK "UUID"
        bigint user_id FK "상담사(필수)"
        uuid client_id FK "내담자"
        varchar title "제목(18)"
        varchar description "설명(200)"
        jsonb audio_meta_data "음성메타"
        timestamptz created_at
    }

    ONBOARDING {
        uuid id PK "UUID"
        bigint user_id FK "사용자(UK,필수)"
        smallint step "단계"
        onboarding_state state "상태 ENUM"
        timestamptz completed_at
    }

    PROGRESS_NOTES {
        uuid id PK "UUID"
        uuid session_id FK "세션(필수)"
        bigint user_id FK "상담사(필수)"
        varchar title "제목(18)"
        integer template_id FK "템플릿"
        text summary "요약"
        timestamptz created_at
    }

    TRANSCRIBES {
        uuid id PK "UUID"
        uuid session_id FK "세션(필수)"
        bigint user_id FK "상담사(필수)"
        varchar title "제목(18)"
        date counsel_date "상담일"
        text contents "전사내용"
        timestamptz created_at
    }

    TEMPLATES {
        integer id PK "IDENTITY"
        varchar title "제목(24)"
        varchar description "설명(200)"
        text prompt "프롬프트"
        timestamptz created_at
    }

    TEMPLATE_PIN {
        uuid id PK "UUID"
        integer template_id FK "템플릿(필수)"
        bigint user_id FK "사용자(필수)"
    }

    PLANS {
        uuid id PK "UUID"
        varchar type "타입(15,UK)"
        varchar description "설명(50)"
        integer price "가격"
        integer total_credit "총크레딧"
    }

    SUBSCRIBE {
        uuid id PK "UUID"
        bigint user_id FK "사용자(필수)"
        uuid plan_id FK "플랜(필수)"
        text billing_key "결제키"
        timestamptz start_at "시작시각"
        timestamptz end_at "종료시각"
        timestamptz last_paid_at "최근결제"
        boolean is_canceled "취소여부"
    }

    CARD {
        uuid id PK "UUID"
        bigint user_id FK "사용자(필수)"
        card_type type "카드타입 ENUM"
        varchar company "카드사(6)"
        varchar number "카드번호(16)"
        timestamptz created_at
    }

    PAYMENTS {
        uuid id PK "UUID"
        bigint user_id FK "사용자(필수)"
        uuid plan_id FK "플랜(필수)"
        timestamptz expired_at "만료시각"
        payment_status status "상태 ENUM"
        timestamptz created_at
    }

    USAGE {
        uuid id PK "UUID"
        bigint user_id FK "사용자(필수)"
        uuid plan_id FK "플랜(필수,UK)"
        integer total_usage "총사용량"
        timestamptz reset_at "리셋시각"
    }

    CREDIT_LOG {
        uuid id PK "UUID"
        bigint user_id FK "사용자(필수)"
        varchar use_type "사용타입(30)"
        integer use_amount "사용량"
        jsonb feature_metadata "기능메타데이터"
        varchar log_memo "메모(50)"
        timestamptz created_at
    }
```

---

## 핵심 데이터 흐름

### 1. 사용자 등록 플로우

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant Users
    participant Onboarding

    Client->>Auth: 회원가입 (email, password)
    Auth->>Auth: auth.users 생성
    Auth-->>Users: 트리거: on_auth_user_created
    Users->>Users: public.users 생성 (email 기반)
    Users-->>Onboarding: 트리거: on_user_created_create_onboarding
    Onboarding->>Onboarding: onboarding 레코드 생성 (step=0, state=pending)
    Auth-->>Client: 이메일 인증 링크 발송
```

### 2. 이메일 인증 플로우

```mermaid
sequenceDiagram
    participant User
    participant Auth
    participant Users

    User->>Auth: 이메일 인증 링크 클릭
    Auth->>Auth: email_confirmed_at 업데이트
    Auth-->>Users: 트리거: sync_email_verified_at
    Users->>Users: email_verified_at 동기화
    Auth-->>User: 인증 완료
```

### 3. 온보딩 플로우

```mermaid
sequenceDiagram
    participant Client
    participant Onboarding
    participant Users

    Client->>Onboarding: POST /onboarding/status
    Onboarding-->>Client: {step: 0, state: "pending"}

    Client->>Onboarding: POST /onboarding/save
    Note over Onboarding: name, phone_number, organization 저장
    Onboarding->>Users: 프로필 업데이트
    Onboarding->>Onboarding: step=0, state="in_progress"
    Onboarding-->>Client: {step: 0, state: "in_progress"}

    Client->>Onboarding: POST /onboarding/complete
    Onboarding->>Onboarding: step=3, state="completed"
    Onboarding-->>Client: {step: 3, state: "completed"}
```

### 4. 내담자 등록 플로우

```mermaid
sequenceDiagram
    participant Client
    participant EdgeFunction
    participant Clients

    Client->>EdgeFunction: POST /clients/create
    Note over Client: counselor_email, name, counsel_theme, memo 등
    EdgeFunction->>EdgeFunction: counselor 조회 (email)
    EdgeFunction->>Clients: INSERT clients
    Note over Clients: id=UUID, counselor_id, name, counsel_theme, memo
    Clients-->>EdgeFunction: client 생성 완료
    EdgeFunction-->>Client: {client: {id, name}}
```

### 5. 상담 세션 생성 플로우

```mermaid
sequenceDiagram
    participant Client
    participant Sessions
    participant Clients

    Client->>Sessions: 세션 생성
    Note over Client: user_id, client_id, title, description
    Sessions->>Sessions: INSERT sessions
    Sessions-->>Client: session 생성 완료

    Client->>Sessions: 상담 진행
    Sessions-->>Sessions: audio_meta_data 저장
```

---

## 관계 설명

### 1:N 관계

| 부모 테이블 | 자식 테이블    | 관계 설명                                                                          |
| ----------- | -------------- | ---------------------------------------------------------------------------------- |
| users       | clients        | 상담사 1명이 여러 내담자 관리                                                      |
| users       | sessions       | 상담사 1명이 여러 세션 진행                                                        |
| clients     | sessions       | 내담자 1명이 여러 세션 참여                                                        |
| sessions    | progress_notes | 세션 1개에 여러 경과 기록                                                          |
| sessions    | transcribes    | 세션 1개에 여러 전사 내용                                                          |
| templates   | template_pin   | 템플릿 1개가 여러 사용자에게 고정됨                                                |
| templates   | progress_notes | 템플릿 1개가 여러 경과 기록에 사용됨                                               |
| templates   | users          | 템플릿 1개가 여러 사용자의 기본 템플릿으로 설정됨                                  |
| users       | subscribe      | 사용자 1명이 여러 구독 이력                                                        |
| plans       | subscribe      | 플랜 1개에 여러 구독자                                                             |
| plans       | payments       | 플랜 1개에 여러 결제 이력                                                          |
| plans       | usage          | 플랜 1개에 여러 사용량 기록                                                        |
| users       | credit_log     | 사용자 1명이 여러 크레딧 로그 (session_id, subscribe_id는 feature_metadata에 포함) |

### 애플리케이션 레벨 참조

**Foreign Key가 없는 이유:**

- 유연성: 스키마 변경 용이
- 성능: FK 체크 오버헤드 제거
- 독립성: 마이크로서비스 아키텍처 대비

**참조 무결성 보장 방법:**

- Edge Function에서 조회 후 삽입
- 존재하지 않는 ID 참조 시 404 에러 반환
- 트랜잭션 사용 시 롤백 처리

---

## 인덱스 전략

### 1. 주요 조회 패턴

**사용자별 데이터 조회:**

```sql
-- 내담자 목록 조회
SELECT * FROM clients WHERE counselor_id = ? ORDER BY created_at DESC;
-- 인덱스: idx_clients_counselor_created_desc

-- 세션 목록 조회
SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC;
-- 인덱스: idx_sessions_user_client_created_desc
```

**내담자별 세션 조회:**

```sql
-- 특정 내담자의 세션 조회
SELECT * FROM sessions WHERE client_id = ? ORDER BY created_at DESC;
-- 인덱스: idx_sessions_client_created_desc
```

### 2. 인덱스 목록

| 테이블   | 인덱스명                              | 컬럼                                  | 타입        |
| -------- | ------------------------------------- | ------------------------------------- | ----------- |
| users    | users_pkey                            | id                                    | PRIMARY KEY |
| users    | users_email_key                       | email                                 | UNIQUE      |
| clients  | clients_pkey                          | id                                    | PRIMARY KEY |
| clients  | idx_clients_counselor_created_desc    | (counselor_id, created_at DESC)       | INDEX       |
| sessions | sessions_pkey                         | id                                    | PRIMARY KEY |
| sessions | idx_sessions_user_client_created_desc | (user_id, client_id, created_at DESC) | INDEX       |
| sessions | idx_sessions_client_created_desc      | (client_id, created_at DESC)          | INDEX       |

---

## ENUM 타입 정의

| ENUM 타입        | 값                              | 사용 테이블 |
| ---------------- | ------------------------------- | ----------- |
| onboarding_state | pending, in_progress, completed | onboarding  |
| payment_status   | in_progress, success, failed    | payments    |
| card_type        | 신용, 체크                      | card        |

---

## 주요 변경 이력

### v1.9 (2025-11-18)

- **중요 변경:** 통합 크레딧 시스템 도입
- PLANS: `audio_credit`, `summary_credit` → `total_credit` 통합
- USAGE: `audio_usage`, `summary_usage` → `total_usage` 통합
- CREDIT_LOG: `session_id`, `subscribe_id` 제거 → `feature_metadata`로 통합
- CREDIT_LOG: `feature_metadata` 컬럼 추가 (모든 메타데이터 JSONB 통합),
  `use_type` 길이 확장 (8→30)
- CREDIT_LOG: GIN 인덱스 추가 (JSONB 검색 성능 최적화)
- Row-level lock 기반 동시성 안전 크레딧 관리 시스템 구현
- Credit Manager Edge Function 추가 (POST /functions/v1/credit-manager)

### v1.8 (2025-11-18)

- clients.counsel_done 추가 (상담 종결 여부)
- user 헬퍼 함수 업데이트 (email_verified_at, organization, default_template_id
  반환 추가)

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
- templates-users 관계 추가 (기본 템플릿)

### v1.4 (2025-11-18)

- **문서 수정:** 실제 데이터베이스 스키마에 맞춰 ERD 전면 수정
- ENUM 타입 정확히 반영 (onboarding_state, payment_status, card_type)
- templates, plans, subscribe, card, payments, usage, credit_log 스키마 정정
- counsel_notes.content → summary, transcribes.content → contents 수정
- 관계도 정확히 수정 (templates-users 관계 제거 등)

### v1.3 (2025-11-18)

- clients.counsel_theme 추가
- 상담 주제 UI 표시 개선

### v1.2 (2025-11-18)

- **중요 변경:** clients.id bigint → uuid 변경
- **중요 변경:** clients.group_id 제거 (동반인 개념 제거)
- sessions.group_id → sessions.client_id로 변경
- 내담자와 세션 1:1 매핑으로 단순화

### v1.1 (2025-11-14)

- users.email_verified_at 추가 (이메일 인증 상태 추적)
- users.organization 추가 (소속 기관)
- clients.email 추가

### v1.0 (2025-11-12)

- 초기 ERD 설계
- 14개 테이블 정의
- FK 제거 정책 확립
