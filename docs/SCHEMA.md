# Database Schema

## Tables

> 자세한 스키마는 https://dbdiagram.io/d/6911771c6735e11170fec563 에서 확인 가능

### users

사용자 기본 정보

| Column            | Type         | Constraints        | Description                                     |
| ----------------- | ------------ | ------------------ | ----------------------------------------------- |
| id                | bigint       | PK, AUTO INCREMENT | 사용자 고유 ID                                  |
| email             | varchar(320) | UNIQUE             | 이메일 주소 (auth.users 연결키)                 |
| email_verified_at | timestamptz  |                    | 이메일 인증 완료일시 (auth.users와 자동 동기화) |
| name              | varchar(12)  |                    | 사용자 이름                                     |
| phone_number      | varchar(15)  |                    | 전화번호                                        |
| created_at        | timestamptz  | NOT NULL           | 생성일시                                        |
| updated_at        | timestamptz  | NOT NULL           | 수정일시                                        |

**Indexes:**

- `users_email_key` (UNIQUE): email

---

### onboarding

온보딩 진행 상태

| Column       | Type             | Constraints | Description            |
| ------------ | ---------------- | ----------- | ---------------------- |
| id           | uuid             | PK          | 온보딩 고유 ID         |
| user_id      | bigint           | UNIQUE      | 사용자 ID (users.id)   |
| step         | smallint         |             | 현재 단계 (0부터 시작) |
| state        | onboarding_state | NOT NULL    | 진행 상태              |
| completed_at | timestamptz      |             | 완료일시               |

**Constraints:**

- `onboarding_user_id_key` (UNIQUE): user_id

---

### sessions

상담 세션 정보

| Column          | Type        | Constraints | Description          |
| --------------- | ----------- | ----------- | -------------------- |
| id              | uuid        | PK          | 세션 고유 ID         |
| user_id         | bigint      | NOT NULL    | 상담사 ID (users.id) |
| group_id        | bigint      |             | 그룹 ID              |
| title           | varchar(12) |             | 세션 제목            |
| description     | varchar(45) |             | 세션 설명            |
| audio_meta_data | jsonb       |             | 음성 메타데이터      |
| created_at      | timestamptz | NOT NULL    | 생성일시             |

**Indexes:**

- `idx_sessions_user_group_created_desc`: (user_id, group_id, created_at DESC)
- `idx_sessions_group_created_desc`: (group_id, created_at DESC)

---

### transcribes

상담 녹취록

| Column       | Type        | Constraints | Description           |
| ------------ | ----------- | ----------- | --------------------- |
| id           | uuid        | PK          | 녹취록 고유 ID        |
| session_id   | uuid        | NOT NULL    | 세션 ID (sessions.id) |
| user_id      | bigint      | NOT NULL    | 작성자 ID (users.id)  |
| title        | varchar(12) |             | 녹취록 제목           |
| counsel_date | date        |             | 상담일자              |
| contents     | text        |             | 녹취 내용             |
| created_at   | timestamptz | NOT NULL    | 생성일시              |

**Indexes:**

- `idx_transcribes_session`: session_id

---

### templates

요약 템플릿

| Column      | Type        | Constraints | Description    |
| ----------- | ----------- | ----------- | -------------- |
| id          | uuid        | PK          | 템플릿 고유 ID |
| title       | varchar(20) |             | 템플릿 제목    |
| description | varchar(40) |             | 템플릿 설명    |
| prompt      | text        |             | 프롬프트 내용  |
| created_at  | timestamptz | NOT NULL    | 생성일시       |

---

### counsel_notes

상담 요약 노트

| Column      | Type        | Constraints | Description              |
| ----------- | ----------- | ----------- | ------------------------ |
| id          | uuid        | PK          | 노트 고유 ID             |
| session_id  | uuid        | NOT NULL    | 세션 ID (sessions.id)    |
| user_id     | bigint      | NOT NULL    | 작성자 ID (users.id)     |
| title       | varchar(18) |             | 노트 제목                |
| template_id | uuid        |             | 템플릿 ID (templates.id) |
| summary     | text        |             | 요약 내용                |
| created_at  | timestamptz | NOT NULL    | 생성일시                 |

**Indexes:**

- `idx_counsel_notes_session`: session_id
- `idx_counsel_notes_user_created_desc`: (user_id, created_at DESC)

---

### clients

내담자 정보

| Column         | Type         | Constraints | Description               |
| -------------- | ------------ | ----------- | ------------------------- |
| id             | bigint       | PK          | 내담자 고유 ID            |
| group_id       | integer      |             | 그룹 ID                   |
| counselor_id   | bigint       |             | 담당 상담사 ID (users.id) |
| name           | varchar(12)  |             | 내담자 이름               |
| phone_number   | varchar(15)  |             | 전화번호                  |
| counsel_number | smallint     |             | 상담 횟수                 |
| memo           | varchar(200) |             | 메모                      |
| pin            | boolean      |             | 고정 여부                 |
| created_at     | timestamptz  | NOT NULL    | 생성일시                  |
| updated_at     | timestamptz  | NOT NULL    | 수정일시                  |

**Indexes:**

- `idx_clients_counselor_created_desc`: (counselor_id, created_at DESC)
- `idx_clients_group_created_desc`: (group_id, created_at DESC)

---

### template_pin

사용자별 템플릿 즐겨찾기

| Column      | Type   | Constraints | Description              |
| ----------- | ------ | ----------- | ------------------------ |
| id          | uuid   | PK          | 즐겨찾기 고유 ID         |
| template_id | uuid   | NOT NULL    | 템플릿 ID (templates.id) |
| user_id     | bigint | NOT NULL    | 사용자 ID (users.id)     |

**Constraints:**

- `template_pin_user_id_template_id_key` (UNIQUE): (user_id, template_id)

---

### plans

구독 플랜 정보

| Column         | Type        | Constraints | Description    |
| -------------- | ----------- | ----------- | -------------- |
| id             | uuid        | PK          | 플랜 고유 ID   |
| type           | varchar(15) | UNIQUE      | 플랜 유형 코드 |
| description    | varchar(50) |             | 플랜 설명      |
| price          | integer     |             | 가격 (원)      |
| audio_credit   | integer     |             | 음성 크레딧    |
| summary_credit | integer     |             | 요약 크레딧    |

**Constraints:**

- `plans_type_key` (UNIQUE): type

---

### subscribe

구독 정보

| Column       | Type        | Constraints | Description          |
| ------------ | ----------- | ----------- | -------------------- |
| id           | uuid        | PK          | 구독 고유 ID         |
| user_id      | bigint      | NOT NULL    | 사용자 ID (users.id) |
| plan_id      | uuid        | NOT NULL    | 플랜 ID (plans.id)   |
| billing_key  | text        |             | 빌링키 (결제 토큰)   |
| start_at     | timestamptz |             | 구독 시작일시        |
| end_at       | timestamptz |             | 구독 종료일시        |
| last_paid_at | timestamptz |             | 마지막 결제일시      |
| is_canceled  | boolean     |             | 취소 여부            |

**Indexes:**

- `idx_subscribe_user`: user_id
- `idx_subscribe_plan`: plan_id

---

### card

결제 카드 정보

| Column     | Type        | Constraints | Description            |
| ---------- | ----------- | ----------- | ---------------------- |
| id         | uuid        | PK          | 카드 고유 ID           |
| user_id    | bigint      | NOT NULL    | 사용자 ID (users.id)   |
| type       | card_type   |             | 카드 유형              |
| company    | varchar(6)  |             | 카드사                 |
| number     | varchar(16) |             | 카드번호 (마스킹 권장) |
| created_at | timestamptz | NOT NULL    | 등록일시               |

**Indexes:**

- `idx_card_user_created_desc`: (user_id, created_at DESC)

---

### payments

결제 내역

| Column     | Type           | Constraints | Description          |
| ---------- | -------------- | ----------- | -------------------- |
| id         | uuid           | PK          | 결제 고유 ID         |
| user_id    | bigint         | NOT NULL    | 사용자 ID (users.id) |
| plan_id    | uuid           | NOT NULL    | 플랜 ID (plans.id)   |
| expired_at | timestamptz    |             | 만료일시             |
| status     | payment_status |             | 결제 상태            |
| created_at | timestamptz    | NOT NULL    | 결제 요청일시        |

**Indexes:**

- `idx_payments_user_created_desc`: (user_id, created_at DESC)

---

### usage

크레딧 사용량

| Column        | Type        | Constraints | Description          |
| ------------- | ----------- | ----------- | -------------------- |
| id            | uuid        | PK          | 사용량 고유 ID       |
| user_id       | bigint      | NOT NULL    | 사용자 ID (users.id) |
| plan_id       | uuid        | NOT NULL    | 플랜 ID (plans.id)   |
| audio_usage   | integer     |             | 음성 사용량          |
| summary_usage | integer     |             | 요약 사용량          |
| reset_at      | timestamptz |             | 리셋일시             |

**Constraints:**

- `usage_user_id_plan_id_key` (UNIQUE): (user_id, plan_id)

---

### credit_log

크레딧 사용 로그

| Column       | Type        | Constraints | Description            |
| ------------ | ----------- | ----------- | ---------------------- |
| id           | uuid        | PK          | 로그 고유 ID           |
| user_id      | bigint      | NOT NULL    | 사용자 ID (users.id)   |
| subscribe_id | uuid        |             | 구독 ID (subscribe.id) |
| session_id   | uuid        |             | 세션 ID (sessions.id)  |
| use_type     | varchar(8)  |             | 사용 유형              |
| use_amount   | integer     |             | 사용량                 |
| log_memo     | varchar(50) |             | 로그 메모              |
| created_at   | timestamptz | NOT NULL    | 생성일시               |

**Indexes:**

- `idx_credit_log_user_created_desc`: (user_id, created_at DESC)

---

## Custom Types (Enums)

### onboarding_state

```
'pending' | 'in_progress' | 'completed'
```

### payment_status

```
'in_progress' | 'success' | 'failed'
```

### card_type

```
'신용' | '체크'
```

---

## Sequences

- `users_id_seq`: users.id 자동 증가
