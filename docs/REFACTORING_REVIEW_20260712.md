# feature/parser-refactor 리뷰 가이드 (2026-07-12)

develop 기반 로컬 브랜치, 총 **19커밋** (미푸시). 파서 리팩터링에서 시작해
디자인시스템 역산·중앙화까지 3단계로 진행. 커밋 단위가 곧 리뷰 단위다.

- 상세 디자인시스템 분석: [DESIGN_SYSTEM_AUDIT_20260712.md](./DESIGN_SYSTEM_AUDIT_20260712.md)
- 검증: `pnpm typecheck` ✓ · `pnpm lint`(에러 0) ✓ · 단위 테스트 403건 ✓ · `pnpm build` ✓
  · 브라우저 전/후 비교(하단 §4) ✓

---

## 1단계 — 파서 리팩터링 (10커밋)

축어록 태그 문법(`⟪nv:KEY⟫` · `⟪deid:KEY|원본⟫` · `{%SAEO%…%}`)이 7개 파일에
정규식 복제로 흩어져 있던 것을 단일 소스로 통합. **동작 변화 없음.**

| 커밋 | 내용 | 리뷰 포인트 |
|---|---|---|
| `a66de84` | 태그 정규식·라벨 → `utils/transcriptTags.ts` 단일 모듈 (4개 유틸 재배선) | 정규식 팩토리(lastIndex 미공유), deid 캡처그룹 2개로 통일 → `$1`→`$2` 치환부 |
| `953be1b` | 복사 훅·세그먼트 편집기 재배선 + 태그 직렬화 빌더(`build*Tag`) | 편집기 파싱↔저장 경로가 같은 그래머 공유 |
| `3429acf` | STT 모델 리터럴 5곳 → `utils/sttModel.ts` 술어 4종 | `gemini-3\|advanced`=고급 축어록, `basic\|advanced`=비식별화 지원 의미 확인 |
| `88ab538` | 동명이함수 `getSpeakerDisplayName` 충돌 해소 → 복사용은 `getSpeakerCopyName`으로 `getSpeakerInfo.ts`에 통합, `speakerUtils.ts` 삭제 | 복사('내담자')↔UI('내담자 A') 규칙 차이는 하위호환 위해 **유지** (통일은 제품 결정) |
| `8c44e22` | `isTranscriptJson` any→unknown + `getTranscriptData` 테스트 8건 | — |
| `bbcb6f3` | 미사용 API 삭제: `parseDeidText`·`renderDeidText`·`DeidPart` (88줄) | 외부 소비처 없음 확인됨 |
| `9503ac1` | 파싱(.ts)/렌더링 분리: `parseNonverbalText.ts`(순수) + `widgets/session/TranscriptText.tsx`(칩 렌더 컴포넌트) | TranscriptSegment의 수동 조합 → `<TranscriptText/>` 단일 사용 |
| `29a33f4` | 뷰/에디터 칩 색상 이중 정의 → `transcriptChipStyles.ts` 통합 | 에디터 칩에 다크모드 변형 적용됨(뷰와 정합) — 유일한 의도적 시각 변화 |
| `3673afb` | 미커버 테스트 보강 +28건 (세션 파서 총 86건) | formatPreview의 비식별 원본 노출 차단 케이스 |
| `915b216` | import 그룹 린트 정리 | — |

## 2단계 — 디자인시스템 역산 (4커밋)

전체 TSX 클래스 사용 통계 + 토큰 값 대조로 de facto 시스템을 역산.

| 커밋 | 내용 | 픽셀 영향 |
|---|---|---|
| `0caa988` | **fg 토큰 버그 수정**: `fg.DEFAULT`가 미정의 변수 `--color-default` 참조 → 라이트 모드 본문·`text-fg`(395곳)가 UA 폴백 `#000` 렌더 | **의도적**: `#000`→설계값 `#3c3c3c` (실측 §4-1) |
| `2694c8f` | 동값 이중 표기 정규화 214건/86파일: `text-base→text-m`, `font-bold→font-headline`, `rounded-xl→rounded-lg`(둘 다 0.75rem), `shadow-sm/md/lg→subtle/default/elevated` | 없음 (Tailwind v3.4 기본값과 토큰이 동값임을 대조 확인) |
| `a7bb429` | 축어록 칩 12색 → `--color-chip-*` 토큰, `dark:` 유틸 제거 | 없음 |
| `1e7233c` | 역산 감사 문서 신설 | — |

## 3단계 — 색상·크기 중앙화 (5커밋)

> 목표 달성: **UI 색·크기 수정 지점 = `src/styles/tokens.css`(값) + `tailwind.config.ts`(매핑) 2파일.**

| 커밋 | 내용 | 픽셀 영향 |
|---|---|---|
| `9307bc3` | 토큰 신설: `danger-surface`·`info-subtle/strong`·`brand.google/kakao/…`, radius `xs/2xl` 편입, shadow `modal` + **raw 표기(sm/md/lg/xl, rounded-xl)를 토큰 별칭화해 재유입 차단** | 없음 |
| `6ddb663` | raw 팔레트 41파일 이행: red-500/600→`danger`, green/gray/blue raw→토큰, 브랜드 hex→`brand.*` | **통일**: 에러·성공색 토큰 수렴. `bg-red-50`이 프로젝트 red-50 오버라이드(#f77575)에 걸려 연분홍 의도보다 진하게 렌더되던 **기존 버그를 `danger-surface`(#fff5f5)로 복원** |
| `cd12f42` | 임의 hex 클래스 **61→0건** (동값 스냅 + calendar 드리프트 스냅), `clientAvatarPalette` 복제 2본→`shared/constants` 단일화 | 드리프트 스냅부만 미세 변화 (`#ecedf3`→grey-30 등) |
| `4f98cb0` | 감사 문서 갱신 (해소 갭 표시) | — |
| `7bb775b` | import 린트 정리 | — |

---

## 4. 브라우저 전/후 검증 (develop vs 브랜치)

방법: develop 스냅샷(dev 서버) vs 브랜치(프로덕션 빌드 preview)를 Playwright로
동일 뷰포트 캡처·computed style 실측. 스크린샷: 세션 스크래치패드 `shots/` 디렉터리.

### 4-1. 실측 (computed style)

| 항목 | before(develop) | after(브랜치) |
|---|---|---|
| `body` 텍스트 색 | `rgb(0, 0, 0)` ← 버그 | `rgb(60, 60, 60)` = `#3c3c3c` 설계값 ✓ |
| `--color-danger-surface` | (미정의) | `#fff5f5` ✓ |
| `--color-brand-kakao` | (미정의) | `#fee500` ✓ |
| `--color-chip-silence-bg` | (미정의) | `#f3f4f6` ✓ |

### 4-2. 화면 비교 (공개 라우트)

| 화면 | 결과 |
|---|---|
| `/auth` 로그인 | 전/후 동일. 카카오 버튼 노랑이 `bg-brand-kakao` 토큰으로 정상 렌더 |
| `/auth/reset-password` | 전/후 동일 |
| `/unsubscribe` | 전/후 동일 (에러 문구 red-50 토큰 유지) |
| `/terms` | 전/후 동일 |

※ dev 서버를 수정 전부터 켜둔 채로 보면 신규 토큰 클래스(`bg-brand-kakao` 등)가
빈 스타일로 보일 수 있음 — **dev 서버 재시작 필요** (프로덕션 빌드는 정상 확인됨).

### 4-3. 로그인 후 직접 확인 권장 화면 (인증 필요로 자동 캡처 불가)

1. **업로드 에러 카드** (홈/다중 업로드): 배경이 진한 빨강 → 연분홍(`danger-surface`)으로 복원된 곳
2. **삭제 버튼 호버** (축어록 세그먼트·가계도 툴바·리포트 목록): hover 배경 연분홍화
3. **결제 성공/실패** (`/payment/success·fail`): 아이콘 원 배경 green-20/danger-subtle
4. **축어록 비언어 칩** (세션 상세): 색 변화 없어야 정상 (토큰 승격만)
5. **캘린더 사이드바**: 드리프트 hex → grey 토큰 미세 스냅
6. **카드 등록 모달** (설정): 안내 박스 `info-subtle` 배경

---

## 5. 알려진 잔여 항목

감사 문서 §3 참조: 화자 아바타 팔레트 CSS 토큰화(선택), `text-lg/3xl` 오프스케일 9건,
`interact-*` 레시피 저채택, 전역 border 기본색(slate 하드코딩), 다크모드 값 기획 확정 대기.
