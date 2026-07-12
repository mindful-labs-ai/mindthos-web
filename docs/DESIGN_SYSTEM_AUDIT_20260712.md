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
| `docs` | 본 문서 | — |

---

## 3. 남은 갭 (우선순위)

### P1 — 일관성 깨짐 (사용자 눈에 보이는 이중 시스템)

1. **red 이중 스케일**: 토큰 `red-20/50/80` vs raw `red-500(17)·600(8)·100·300` 혼용.
   삭제 버튼류가 파일마다 다른 빨강. → `danger`(hover/active 포함)로 이행 권장.
   주 위치: genogram 툴바, payment, home 위젯, TranscriptSegment 삭제 버튼.
2. **hex 드리프트**: `border-[#ecedf3]`(13) ≈ grey-30 `#edeff6`, `text-[#a1a2a8]`(7) ≈ grey-70,
   `text-[#abaebe]`(6) ≈ grey-60 — 토큰과 **미묘하게 다른** 눈대중 값. calendar 피처에 집중.
   → 디자인 확인 후 토큰으로 스냅 권장 (픽셀 미세 변화 수반).

### P2 — 시스템 편입 대상

3. **화자 아바타 팔레트**: `getSpeakerInfo.ts`의 10색 로테이션(purple/pink/indigo/… `-100/-600`) +
   역할색(상담사 red, 내담자 green/blue)이 raw 팔레트. 칩과 같은 방식(`--color-avatar-*`)으로 승격 가능.
4. **라디우스 갭**: `rounded`(0.25rem, 54회)·`rounded-2xl`(1rem, 68회)이 토큰 스케일 밖.
   → `--radius-xs(0.25)`·`--radius-xl(1rem)` 추가 후 흡수 권장.
5. **오프스케일 타이포 잔여**: `text-lg`(6)·`text-3xl`(3) — 동값 토큰 없음(20px 대비 18px/30px).
   개별 확인 후 `text-l`/`text-2xl`로 스냅 여부 결정.
6. **레시피 저채택**: `interact-*`(idle→hover→active 묶음)·`card-base`·`dialog-panel`이
   정의만 있고 거의 미사용. 신규 코드 가이드에 명시하거나 제거 결정 필요.

### P3 — 후보/기록

7. **모달 고정폭**: `w-[400px]`(45)·`w-[600px]`(30)·`w-[500px]`(14)·`w-[300px]`(25) —
   사실상 모달 사이즈 스케일. `--width-modal-{sm,md,lg}` 토큰 후보.
8. **반복 그림자**: `shadow-[0px_4px_24px_rgba(0,0,0,0.1)]`(11) — 기존 4단과 다른 값. 토큰 승격 후보.
9. **전역 border 기본색**: `tailwind.css`의 `* { border-color: rgb(100 116 139 / 0.2) }` —
   slate 하드코딩. `--color-border-subtle` 참조로 교체 후보 (전역 영향이라 신중히).
10. **다크모드**: `.dark` 토큰이 라이트와 동일 값(구조만 준비 상태). 기획 확정 시 tokens.css만 교체하면 됨 —
    이번 정리로 `dark:` 유틸리티 의존은 제거됨.

---

## 4. 유지 가이드 (역산 결과의 규범화)

- 새 색상은 **semantic 토큰 우선** (`fg/surface/primary/danger/chip-*`), 팔레트 직접 참조는 `grey-*`만 허용적.
- raw Tailwind 팔레트(`gray/blue/red-500` 등)와 임의 hex(`text-[#...]`)는 추가 금지 —
  필요한 색이면 tokens.css에 토큰부터 정의.
- 그림자·라디우스는 토큰 명칭(`shadow-subtle`, `rounded-lg`)만 사용. `shadow-sm`·`rounded-xl` 등
  동값 별칭 재유입 금지 (lint 규칙 후보: eslint-plugin-tailwindcss `no-arbitrary-value` 등 검토).
- 타이포는 `typo-*` 조합 클래스 우선, 예외 시 커스텀 스케일(`text-m` 등)만.
