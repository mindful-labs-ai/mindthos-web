# Project Overview

Mindthos Web is a Vite + React application. The repo is organized as follows:

- `src/` – UI `components/ui`, 도메인 기능 `feature/`, 라우팅 `router/`, 전역
  상태 `stores/`, API 클라이언트 `services/`, 디자인 토큰 `src/styles` 및
  `tailwind.config.ts`.
- `public/` – 정적 자산, `docs/` – 제안서·ADR, `tests/e2e/*.spec.ts` –
  Playwright 시나리오.
- 단위 테스트는 대상 파일 옆(`Button.test.tsx`, `__tests__/`)에 두고
  `src/test/setup.ts`에서 공통 설정을 불러옵니다.

# Build and Test Instructions

- **Setup**: 한 번 `pnpm install`을 실행하고 `.env.example`을 기반으로
  `.env.local`을 준비합니다.
- **Run**: 개발 서버는 `pnpm dev`, 프로덕션 검증은 `pnpm build && pnpm preview`.
- **Quality**: 최소 `pnpm typecheck`와 `pnpm lint`를 돌리며 필요 시
  `pnpm lint:fix`, `pnpm format`, `pnpm format:check`로 정리합니다.
- **Test**: 단위 `pnpm test`(watch) / `pnpm test:ci`(커버리지), 통합
  `pnpm e2e`/`pnpm e2e:ci`, 전체 CI 합본 `pnpm test:all`.
- **Storybook**: `pnpm storybook`, `pnpm build-storybook`,
  `pnpm storybook:test`를 사용해 컴포넌트 카탈로그를 검증합니다.

# Coding Guidelines

- Prettier(Organize Imports + Tailwind)로 2칸 인덴트와 클래스·임포트 정렬을
  맞추고 수동 포맷은 피합니다.
- ESLint가 React 19 hooks, JSX a11y,
  `import/order`(`react`→external→`@/**`→parent→sibling→index`)를 검사하므로
  경고를 남기지 않습니다.
- 네이밍: 컴포넌트는 PascalCase, 훅·스토어는 camelCase(`useThemeStore`),
  디렉터리는 kebab-case, 서비스·스토어는 `authService`처럼 접미사를 둡니다.
- 모든 UI는 함수형 컴포넌트로 작성하고 명시적 Props를 선언하며, 상대경로 대신
  `@/` 별칭을 사용합니다.

# Testing Protocols

- Vitest + React Testing Library 환경(`src/test/setup.ts`)을 기반으로 하고
  접근성 검증에는 `vitest-axe`를 적용합니다.
- `pnpm test:ci --coverage` 기준 라인·함수·구문 80% 이상을 유지하며,
  스토어·서비스·가드 수정 시 회귀 테스트를 추가합니다.
- 테스트 파일명은 단위 `*.test.tsx`, E2E `*.spec.ts` 규칙을 따르며, 스냅샷보다
  행동 기반 단언을 우선합니다.

# Security and Best Practices

- `.env.local`의 모든 키는 `src/lib/env.ts`의 Zod 검증을 통과해야 하며, Supabase
  키와 라우팅 시크릿은 버전에 포함하지 않습니다.
- 새로운 환경 변수는 `docs/`와 해당 PR에 기록합니다. 중요 설정이나 커맨드는
  README/ADR에 보강합니다.
- PR 전 lint + typecheck + 단위 + 관련 e2e(권장 `pnpm test:all`) 결과를 첨부하고
  UI 변경 시 캡처·GIF를 공유합니다.
- 커밋 메시지는 `feat:`, `fix:`, `refact:` 접두사와 한 언어의 명령형 요약을
  사용합니다.
