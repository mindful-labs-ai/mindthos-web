# 디자인시스템 역산 감사 (2026-07-12)

구현된 TSX/스타일 코드 전수 스캔으로 **실제 사용 중인 디자인시스템을 역산**한 결과와,
그 과정에서 정합화한 항목·남은 갭을 기록한다.

- 스캔 대상: `src/**/*.{ts,tsx}` (className 유틸리티), `src/styles/*`, `tailwind.config.ts`
- 판정 기준: 사용 빈도(grep 통계) + 토큰 정의값 대조 (Tailwind v3.4 기본값 vs 프로젝트 토큰)

---

## 1. 확정된 시스템 (de facto standard)

### 1-1. 토큰 아키텍처 — 3계층 (tokens.css)

```
Primitive (기획 원본 hex) → Semantic (역할 매핑) → Tailwind 유틸리티
```

- Primitive: `grey 10~100`(9단), `green 10/20/40/80`, `red 20/50/80`, `yellow 20/80`, `orange 100`
- Semantic: `fg`(-muted/-subtle/-disabled/-inverse), `bg`, `surface`(-contrast/-strong),
  `border`, `primary/danger/neutral`(각 idle→hover→active 3단), `warn/info/success/accent`,
  `chip-*`(이번에 추가)
- Role: `app/sidebar/header/nav/card/input/modal/overlay` + `chip`
- 다크모드: `.dark` 클래스 → 토큰 오버라이드 (`dark:` 유틸리티는 예외적 — 전체 1파일)

### 1-2. 컬러 실사용 순위 (상위)

| 계열 | 사용량 | 비고 |
|---|---|---|
| `text-fg` / `text-fg-muted` | 395 / 377 | 시맨틱이 본문 표준 |
| `grey-*` (프로젝트 팔레트) | 1,511 | vs raw `gray-*` 7회 → grey가 표준 |
| `bg-surface(-contrast)` | 183 / 146 | 표면 표준 |
| `green-80` 계열 | 235 | 브랜드 그린 (= `primary`와 동값) |
| `primary` 계열 | 344 | `green-80` 직접 참조와 혼용 중 |
| `danger`/`red-80` 계열 | 60 / 53 | ⚠️ raw `red-500/600`도 25회 혼입 |

### 1-3. 타이포그래피

- 크기 스케일: `xs(12) sm(14) m(16) l(20) xl(24) 2xl(28)` / 행간 150% (chip 변형 120%)
- 웨이트: `sub(400) medium(500) emphasize(600) headline(700) extrabold(800)`
- 조합 클래스 `typo-{size}(-{weight})` 채택 활발: `typo-sm` 345회, `typo-m` 106회, `typo-xs` 93회
- 실사용: `text-sm` 324 · `text-m` 273 · `text-l` 135 (개별 유틸도 병용)

### 1-4. 라디우스 / 그림자 / 기타

- 라디우스 실사용: `lg(0.75rem)` 437 · `md(0.5rem)` 276 · `full` 151 · `2xl(1rem)` 68 · `rounded(0.25rem)` 54 · `sm(0.375rem)` 28
- 그림자 토큰: `subtle < default < elevated < prominent` (= Tailwind sm/md/lg/xl 동값 리네임)
- z-index: `sidebar(10) < header(20) < dropdown(100) < sticky(200) < overlay(500) < modal(1000) < popover(1100) < tooltip(1200) < toast(1300) < spotlight(1400)`
- 전환: `fast(150ms) normal(200ms) slow(300ms)` + `.transition-default` 조합 클래스(41회)

### 1-5. 컴포넌트 레이어 (shared/ui)

- 구조: `atoms`(Button·Chip·Input·Tab 등 + Storybook 스토리) / `composites` / `primitives`
- 패턴: **`size`/`tone`/`variant` prop + `Record<..., string>` 스타일 맵 + `cn()`** (cva 미사용)
  - Button: tone 6종 × variant 4종(solid/outline/ghost/soft), size `sm/md/lg/free`
  - Chip: tone 4종, size 4종 — *축어록 태그 칩은 contentEditable 직렬화 제약으로 별도(`widgets/session/transcriptChipStyles.ts`)*
- 조합 클래스 채택률: `border-default` 50 · `transition-default` 41 · `focus-default` 32 ·
  `disabled-default` 28 ↔ **`interact-*` 4 · `card-base` 4 · `dialog-panel` 0 (정의만 있고 미채택)**

---

## 2. 이번 감사에서 정합화한 항목 (커밋 4건)

| 커밋 | 내용 | 픽셀 영향 |
|---|---|---|
| `fix(styles)` | `fg.DEFAULT`가 미정의 변수 `--color-default` 참조 → 라이트 모드 본문·`text-fg`(395곳)가 UA 폴백 `#000`으로 렌더되던 버그. `--color-fg`로 통일 | **의도적 변화**: fg 텍스트 `#000` → 설계값 `#3c3c3c` |
| `refactor(styles)` | 동값 이중 표기 정규화 214건: `text-base→text-m`, `font-normal/semibold/bold→sub/emphasize/headline`, `rounded-xl→rounded-lg`(둘 다 0.75rem), `shadow-sm/md/lg→subtle/default/elevated` | 없음 (동값) |
| `refactor(styles)` | 축어록 칩 색상 12종을 `--color-chip-*` 시맨틱 토큰으로 승격, `dark:` 유틸리티 제거 | 없음 (동값) |
| `feat(styles)` | 토큰 인프라 확장: `danger-surface`·`info-subtle/strong`·`brand.*` 신설, radius `xs/2xl` 편입 + `xl`→`lg` 별칭, shadow `modal` 신설 + `sm/md/lg/xl` 토큰 별칭(재유입 차단) | 없음 (동값·신설) |
| `refactor(styles)` | raw 팔레트 41개 파일 토큰 이행: red-500/600→`danger`, bg-red-50→`danger-surface`, green/gray/blue raw→토큰, 브랜드 hex→`brand.*`, 반복 그림자→`shadow-modal` | **통일 변화**: 에러/성공 색이 danger/green 토큰으로 통일. bg-red-50이 red-50 오버라이드(#f77575)에 걸려 과하게 진했던 버그가 의도값(연분홍)으로 복원 |
| `refactor(styles)` | 임의 색상 hex 클래스 61건 → **0건** (동값+드리프트 스냅), `clientAvatarPalette` 복제 2본 → `shared/constants` 단일화 | 드리프트 스냅부만 미세 변화 |
| `docs` | 본 문서 | — |

**중앙화 달성 상태**: 색상·라디우스·그림자·z-index·전환의 수정 지점은
`src/styles/tokens.css`(값) + `tailwind.config.ts`(매핑) 2개 파일.
예외(의도적 분산): 아바타 로테이션 팔레트 2종은 각각 단일 모듈이 소스 —
`shared/constants/clientAvatarPalette.ts`(내담자), `features/session/utils/getSpeakerInfo.ts`(화자).

---

## 3. 남은 갭 (우선순위)

~~P1-1 red 이중 스케일~~ → **해소** (danger 계열 이행 완료)
~~P1-2 hex 드리프트~~ → **해소** (임의 hex 클래스 0건)
~~P2-4 라디우스 갭~~ → **해소** (xs/2xl 편입, 전 스케일 토큰 참조)
~~P3-8 반복 그림자~~ → **해소** (`shadow-modal` 토큰)

### P1 — 코드리뷰에서 확인된 시스템 결함 (기존 버그)

0. **`var()` 색상 + 알파 수정자 CSS 미생성**: Tailwind v3는 `var(--x)` 형태 색상에
   `/알파` 수정자를 적용할 수 없어 `bg-primary/10`·`bg-accent/10`·`bg-orange-100/10` 등
   **13개 파일의 클래스가 처음부터 생성되지 않음** (Button accent hover, Chip
   primary/accent 톤 배경, 편집기 deid 칩 배경 등 조용한 스타일 누락).
   수정 방법: ① 알파 포함 토큰(`--color-primary-tint` 방식 — 캘린더에 적용 완료) 또는
   ② 팔레트를 `rgb(var(--x-rgb) / <alpha-value>)` 채널 방식 전환.
   고치면 의도한 배경이 처음 나타나는 시각 변화 → 디자인 확인 후 진행.

### P2 — 시스템 편입 후보 (판단 필요)

1. **화자 아바타 팔레트**: `getSpeakerInfo.ts`의 10색 로테이션 + 역할색이 raw 팔레트 클래스.
   단일 모듈에 이미 중앙화되어 있어 유지 — CSS 토큰(`--color-avatar-*`) 승격은 선택 사항.
2. **오프스케일 타이포 잔여**: `text-lg`(6)·`text-3xl`(3) — 동값 토큰 없음(18px/30px).
   개별 확인 후 `text-l`/`text-2xl`로 스냅 여부 결정.
3. **레시피 저채택**: `interact-*`·`card-base`·`dialog-panel`이 정의만 있고 거의 미사용.
   신규 코드 가이드에 명시하거나 제거 결정 필요.

### P3 — 기록

4. **고정폭 임의값**: `w-[400px]` 등은 상당수가 Storybook 래퍼·문서 캔버스 폭.
   제품 모달 폭 표준화는 모달 컴포넌트 정비와 함께 검토 (토큰만 먼저 만들면 semantics가 어긋남).
5. **전역 border 기본색**: `tailwind.css`의 `* { border-color: rgb(100 116 139 / 0.2) }` —
   slate 하드코딩. `--color-border-subtle` 참조로 교체 후보 (전역 영향이라 신중히).
6. **다크모드**: `.dark` 토큰이 라이트와 동일 값(구조만 준비 상태). 기획 확정 시 tokens.css만 교체하면 됨 —
   이번 정리로 `dark:` 유틸리티 의존은 제거됨.
7. **미세 크기 임의값**: `h-[41px]`·`px-[19px]` 등 일회성 치수는 컴포넌트 국소 값으로 유지 (토큰화 비대상).

---

## 4. 유지 가이드 (역산 결과의 규범화)

- 새 색상은 **semantic 토큰 우선** (`fg/surface/primary/danger/chip-*`), 팔레트 직접 참조는 `grey-*`만 허용적.
- raw Tailwind 팔레트(`gray/blue/red-500` 등)와 임의 hex(`text-[#...]`)는 추가 금지 —
  필요한 색이면 tokens.css에 토큰부터 정의.
- 그림자·라디우스는 토큰 명칭(`shadow-subtle`, `rounded-lg`)만 사용. `shadow-sm`·`rounded-xl` 등
  동값 별칭 재유입 금지 (lint 규칙 후보: eslint-plugin-tailwindcss `no-arbitrary-value` 등 검토).
- 타이포는 `typo-*` 조합 클래스 우선, 예외 시 커스텀 스케일(`text-m` 등)만.
