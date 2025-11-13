# Entity Relationship Diagram (ERD)

> **Note**: FK 제약조건은 제거, 논리적 관계는 애플리케이션 레벨에서 관리합니다.
>
> 자세한 관계는 https://dbdiagram.io/d/6911771c6735e11170fec563 에서 확인 가능

## 테이블 관계도

```
auth.users (1) ----< (1) users
     |
     | (트리거)
     v
users (1) ----< (1) onboarding
  |
  | (1:N)
  +----< sessions
  |
  | (1:N)
  +----< transcribes
  |
  | (1:N)
  +----< counsel_notes
  |
  | (1:N)
  +----< clients (as counselor)
  |
  | (N:M via template_pin)
  +----< templates
  |
  | (1:N)
  +----< subscribe
  |
  | (1:N)
  +----< card
  |
  | (1:N)
  +----< payments
  |
  | (1:N)
  +----< usage
  |
  | (1:N)
  +----< credit_log

sessions (1) ----< (N) transcribes
         (1) ----< (N) counsel_notes
         (1) ----< (N) credit_log

templates (1) ----< (N) counsel_notes
          (1) ----< (N) template_pin

plans (1) ----< (N) subscribe
      (1) ----< (N) payments
      (1) ----< (N) usage

subscribe (1) ----< (N) credit_log
```

---

## 상세 관계 정의

### 1. Users 중심 관계

#### users ↔ onboarding (1:1)

- **관계**: 한 사용자는 하나의 온보딩 레코드를 가짐
- **연결**: `onboarding.user_id` → `users.id`
- **제약**: `onboarding.user_id` UNIQUE
- **비즈니스 로직**: users INSERT 시 트리거로 자동 생성

#### users ↔ sessions (1:N)

- **관계**: 한 사용자(상담사)는 여러 세션을 생성
- **연결**: `sessions.user_id` → `users.id`
- **인덱스**: `idx_sessions_user_group_created_desc`

#### users ↔ transcribes (1:N)

- **관계**: 한 사용자는 여러 녹취록을 작성
- **연결**: `transcribes.user_id` → `users.id`

#### users ↔ counsel_notes (1:N)

- **관계**: 한 사용자는 여러 상담 노트를 작성
- **연결**: `counsel_notes.user_id` → `users.id`
- **인덱스**: `idx_counsel_notes_user_created_desc`

#### users ↔ clients (1:N)

- **관계**: 한 상담사는 여러 내담자를 관리
- **연결**: `clients.counselor_id` → `users.id`
- **인덱스**: `idx_clients_counselor_created_desc`

#### users ↔ templates (N:M via template_pin)

- **관계**: 사용자와 템플릿은 즐겨찾기를 통해 다대다 관계
- **연결**:
  - `template_pin.user_id` → `users.id`
  - `template_pin.template_id` → `templates.id`
- **제약**: `template_pin(user_id, template_id)` UNIQUE

#### users ↔ subscribe (1:N)

- **관계**: 한 사용자는 여러 구독 이력을 가질 수 있음
- **연결**: `subscribe.user_id` → `users.id`
- **인덱스**: `idx_subscribe_user`

#### users ↔ card (1:N)

- **관계**: 한 사용자는 여러 카드를 등록
- **연결**: `card.user_id` → `users.id`
- **인덱스**: `idx_card_user_created_desc`

#### users ↔ payments (1:N)

- **관계**: 한 사용자는 여러 결제 내역을 가짐
- **연결**: `payments.user_id` → `users.id`
- **인덱스**: `idx_payments_user_created_desc`

#### users ↔ usage (1:N)

- **관계**: 한 사용자는 플랜별 사용량 레코드를 가짐
- **연결**: `usage.user_id` → `users.id`
- **제약**: `usage(user_id, plan_id)` UNIQUE

#### users ↔ credit_log (1:N)

- **관계**: 한 사용자는 여러 크레딧 사용 로그를 가짐
- **연결**: `credit_log.user_id` → `users.id`
- **인덱스**: `idx_credit_log_user_created_desc`

---

### 2. Sessions 중심 관계

#### sessions ↔ transcribes (1:N)

- **관계**: 한 세션은 여러 녹취록을 가질 수 있음
- **연결**: `transcribes.session_id` → `sessions.id`
- **인덱스**: `idx_transcribes_session`

#### sessions ↔ counsel_notes (1:N)

- **관계**: 한 세션은 여러 상담 노트를 가질 수 있음
- **연결**: `counsel_notes.session_id` → `sessions.id`
- **인덱스**: `idx_counsel_notes_session`

#### sessions ↔ credit_log (1:N)

- **관계**: 한 세션의 사용 로그를 기록
- **연결**: `credit_log.session_id` → `sessions.id`

---

### 3. Templates 중심 관계

#### templates ↔ counsel_notes (1:N)

- **관계**: 한 템플릿으로 여러 노트 생성 가능
- **연결**: `counsel_notes.template_id` → `templates.id`
- **비고**: nullable (템플릿 없이도 노트 작성 가능)

#### templates ↔ template_pin (1:N)

- **관계**: 한 템플릿을 여러 사용자가 즐겨찾기
- **연결**: `template_pin.template_id` → `templates.id`

---

### 4. Plans 중심 관계

#### plans ↔ subscribe (1:N)

- **관계**: 한 플랜으로 여러 구독 발생
- **연결**: `subscribe.plan_id` → `plans.id`
- **인덱스**: `idx_subscribe_plan`

#### plans ↔ payments (1:N)

- **관계**: 한 플랜으로 여러 결제 발생
- **연결**: `payments.plan_id` → `plans.id`

#### plans ↔ usage (1:N)

- **관계**: 한 플랜의 사용량 기록
- **연결**: `usage.plan_id` → `plans.id`
- **제약**: `usage(user_id, plan_id)` UNIQUE

---

### 5. Subscribe 중심 관계

#### subscribe ↔ credit_log (1:N)

- **관계**: 구독별 크레딧 사용 로그
- **연결**: `credit_log.subscribe_id` → `subscribe.id`

---

## 특수 관계

### auth.users ↔ public.users (1:1)

- **관계**: Supabase Auth와 public 스키마 연결
- **연결 방법**: `email` (공통 키)
- **트리거**:
  - `auth.users` INSERT 시 `public.users` 자동 생성
  - `auth.users` INSERT/UPDATE 시 `email_confirmed_at` →
    `public.users.email_verified_at` 동기화
- **함수**:
  - `get_user_by_email(email)`
  - `get_current_user()` - `auth.email()` 사용
  - `sync_email_verified_at()` - 이메일 인증 상태 동기화

### public.users ↔ onboarding (자동 생성)

- **트리거**: `public.users` INSERT 시 `onboarding` 자동 생성
- **초기값**: `step=0`, `state='pending'`

### 이메일 인증 동기화

- **트리거**: `auth.users.email_confirmed_at` 변경 시 자동 동기화
- **대상 컬럼**: `public.users.email_verified_at`
- **용도**: 이메일 인증 여부를 애플리케이션 레벨에서 확인

---

## 관계 유형 요약

| 관계                      | 타입 | 제약                      |
| ------------------------- | ---- | ------------------------- |
| users - onboarding        | 1:1  | user_id UNIQUE            |
| users - sessions          | 1:N  | -                         |
| users - transcribes       | 1:N  | -                         |
| users - counsel_notes     | 1:N  | -                         |
| users - clients           | 1:N  | -                         |
| users - templates         | N:M  | via template_pin          |
| users - subscribe         | 1:N  | -                         |
| users - card              | 1:N  | -                         |
| users - payments          | 1:N  | -                         |
| users - usage             | 1:N  | (user_id, plan_id) UNIQUE |
| users - credit_log        | 1:N  | -                         |
| sessions - transcribes    | 1:N  | -                         |
| sessions - counsel_notes  | 1:N  | -                         |
| sessions - credit_log     | 1:N  | -                         |
| templates - counsel_notes | 1:N  | nullable                  |
| templates - template_pin  | 1:N  | -                         |
| plans - subscribe         | 1:N  | -                         |
| plans - payments          | 1:N  | -                         |
| plans - usage             | 1:N  | -                         |
| subscribe - credit_log    | 1:N  | -                         |

---

## 데이터 정합성 관리 지침

FK 제약조건이 제거되었으므로 다음을 애플리케이션 레벨에서 관리:

1. **삽입 시**: 참조하는 레코드가 존재하는지 확인
2. **삭제 시**:
   - 참조되는 레코드 삭제 시 의존 레코드 처리 (CASCADE 또는 RESTRICT 로직)
   - 예: users 삭제 시 sessions, card 등 처리 전략 필요
3. **업데이트 시**: 참조 무결성 유지
4. **조회 최적화**: 인덱스를 활용한 JOIN 쿼리
