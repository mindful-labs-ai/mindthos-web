# Mindthos V2

프로덕션급 React + TypeScript + Vite 애플리케이션으로 포괄적인 테스트, 디자인
시스템, CI/CD 파이프라인을 갖추고 있습니다.

## 주요 기능

- **모던 스택**: React 19, TypeScript, Vite with SWC
- **스타일링**: Tailwind CSS with 다크 모드 지원 (클래스 기반)
- **테스팅**: Vitest + React Testing Library + Playwright
- **디자인 시스템**: Storybook 기반 컴포넌트 라이브러리
- **코드 품질**: ESLint, Prettier
- **CI/CD**: GitHub Actions를 통한 자동화된 테스트 및 배포
- **타입 안전성**: Strict TypeScript 및 환경 변수 검증 (Zod)

## 사전 요구사항

- Node.js 20.x 이상
- pnpm 9.x (권장 패키지 매니저)

## 빠른 시작

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 개발 서버 시작

```bash
pnpm dev
```

[http://localhost:5173](http://localhost:5173)에서 앱을 확인할 수 있습니다.

## 사용 가능한 스크립트

### 개발

- `pnpm dev` - HMR이 활성화된 개발 서버 시작
- `pnpm build` - 프로덕션용 빌드
- `pnpm preview` - 프로덕션 빌드를 로컬에서 미리보기

### 코드 품질

- `pnpm typecheck` - TypeScript 타입 검사 실행
- `pnpm lint` - ESLint로 코드 린트
- `pnpm format` - Prettier로 코드 포맷
- `pnpm format:check` - 코드 포맷 검사

### 테스팅

- `pnpm test` - 단위 테스트를 watch 모드로 실행
- `pnpm test:ci` - 커버리지와 함께 단위 테스트 실행
- `pnpm e2e` - Playwright로 E2E 테스트 실행
- `pnpm e2e:ci` - CI 모드로 E2E 테스트 실행

### Storybook

- `pnpm storybook` - Storybook 개발 서버 시작
- `pnpm build-storybook` - 배포용 Storybook 빌드
- `pnpm storybook:test` - Storybook 인터랙션 테스트 실행

## 프로젝트 구조

```
mindthos_v2/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI 파이프라인
├── .storybook/                 # Storybook 설정
│   ├── main.ts
│   └── preview.ts
├── .vscode/                    # VSCode 설정
│   ├── settings.json
│   └── extensions.json
├── src/
│   ├── components/
│   │   └── ui/                 # 디자인 시스템 컴포넌트
│   │       ├── Button.tsx
│   │       ├── Button.stories.tsx
│   │       ├── __tests__/
│   │       │   └── Button.test.tsx
│   │       └── index.ts
│   ├── lib/
│   │   └── env.ts              # 환경 변수 검증
│   ├── styles/
│   │   ├── tokens.css          # 디자인 토큰 (CSS 변수)
│   │   └── tailwind.css        # Tailwind 베이스 스타일
│   ├── test/
│   │   └── setup.ts            # 테스트 설정 및 전역 설정
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── e2e/
│       └── smoke.spec.ts       # E2E 스모크 테스트
├── .editorconfig
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── postcss.config.cjs
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 디자인 시스템

### Button 컴포넌트

다양한 variant와 size를 지원하는 접근성 친화적인 버튼 컴포넌트입니다.

```tsx
import { Button } from '@/components/ui'

// Variants
<Button variant="solid">Solid</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button isLoading>Loading</Button>
```

인터랙티브한 예제는 [Storybook](#storybook)을 참고하세요.

## 다크 모드

다크 모드는 `html` 요소의 `dark` 클래스를 기반으로 작동합니다:

```tsx
// 다크 모드 토글
document.documentElement.classList.toggle('dark');
```

테마 컬러는 [src/styles/tokens.css](src/styles/tokens.css)의 CSS 커스텀
프로퍼티로 관리됩니다.

## 테스팅

### 단위 테스트

Vitest와 React Testing Library를 사용하며 다음과 같은 커버리지 임계값을
설정했습니다:

- Lines: 90%
- Functions: 90%
- Statements: 90%
- Branches: 80%

```bash
# Watch 모드
pnpm test

# 커버리지와 함께 한 번 실행
pnpm test:ci
```

### E2E 테스트

Playwright를 사용한 E2E 테스트:

```bash
# 인터랙티브 모드
pnpm e2e

# CI 모드
pnpm e2e:ci
```

## Git 워크플로우

### 커밋 메시지 규칙

Conventional Commits 규칙을 따르는 것을 권장합니다:

```
feat: 다크 모드 토글 추가
fix: 버튼 포커스 링 이슈 해결
docs: README에 설치 가이드 업데이트
style: prettier로 코드 포맷
refactor: 버튼 스타일을 별도 파일로 분리
test: Button 컴포넌트 테스트 추가
chore: 의존성 업데이트
```

## CI/CD

GitHub Actions 워크플로우가 모든 push와 pull request에서 실행됩니다:

1. 타입 검사 (`pnpm typecheck`)
2. 린트 (`pnpm lint`)
3. 포맷 검사 (`pnpm format:check`)
4. 커버리지 포함 단위 테스트 (`pnpm test:ci`)
5. 빌드 (`pnpm build`)
6. E2E 테스트 (`pnpm e2e:ci`)

## 환경 변수

필수 변수:

- `VITE_APP_NAME` - 애플리케이션 이름 (기본값: "Mindthos V2")

## VSCode 설정

권장 확장 프로그램은 [.vscode/extensions.json](.vscode/extensions.json)에
나열되어 있습니다:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Vitest Explorer
- Playwright Test for VSCode

## 문제 해결

### 설치 후 TypeScript 오류

타입 검사를 실행하여 구체적인 오류를 확인하세요:

```bash
pnpm typecheck
```

### ESLint/Prettier 충돌

이 프로젝트는 `eslint-config-prettier`를 사용하여 충돌하는 규칙을
비활성화합니다. 충돌이 발생하면:

```bash
pnpm lint --fix
pnpm format
```

### Playwright 브라우저 설치

브라우저 누락으로 E2E 테스트가 실패하는 경우:

```bash
pnpm dlx playwright install --with-deps
```

## 기술 스택 세부사항

### 빌드 도구

- **Vite 7.1.12**: 빠른 HMR과 번들링을 제공하는 차세대 프론트엔드 빌드 도구
- **SWC**: Rust 기반의 초고속 TypeScript/JavaScript 컴파일러

### UI 라이브러리

- **React 19**: 최신 React 버전으로 성능 및 개발자 경험 개선
- **Tailwind CSS v3**: 유틸리티 퍼스트 CSS 프레임워크 (안정성을 위해 v3 사용)
- **CSS Custom Properties**: 런타임 테마 전환을 위한 디자인 토큰

### 컴포넌트 구성

- **clsx**: 조건부 className 유틸리티

### 테스트 도구

- **Vitest**: Vite 기반의 빠른 단위 테스트 프레임워크
- **@testing-library/react**: React 컴포넌트 테스트
- **@testing-library/user-event**: 사용자 인터랙션 시뮬레이션
- **vitest-axe**: 자동화된 접근성 테스트
- **Playwright**: 크로스 브라우저 E2E 테스트

### 코드 품질 도구

- **TypeScript**: 정적 타입 검사 (strict mode)
- **ESLint**: 코드 린팅 및 품질 검사
  - `eslint-plugin-jsx-a11y`: 접근성 린팅
  - `eslint-plugin-import`: import 문 정리
- **Prettier**: 코드 포맷팅

### 문서화

- **Storybook v8.6.14**: 컴포넌트 문서화 및 개발
  - `@storybook/addon-essentials`: 필수 애드온 번들
  - `@storybook/addon-a11y`: 접근성 검사
  - `@storybook/addon-interactions`: 인터랙션 테스트

## 아키텍처 결정사항

### 왜 Tailwind v3인가?

Tailwind v4는 PostCSS 플러그인 구조가 변경되어 별도의 `@tailwindcss/postcss`
패키지가 필요합니다. 안정성과 호환성을 위해 v3.4.17을 사용합니다.

### 왜 클래스 기반 다크 모드인가?

- 런타임에 즉시 전환 가능
- localStorage와 쉽게 연동
- CSS 미디어 쿼리보다 더 나은 제어

### 왜 CSS 변수인가?

- 런타임 테마 전환 지원
- TypeScript 타입 안정성 유지
- Tailwind와 원활한 통합

### 왜 pnpm인가?

- 디스크 공간 절약 (하드링크 사용)
- 더 빠른 설치 속도
- 엄격한 의존성 관리 (유령 의존성 방지)
