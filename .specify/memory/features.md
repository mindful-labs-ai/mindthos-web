# Mindthos Web - 전체 기능 목록

> 이 문서는 Mindthos Web 프로젝트의 모든 기능과 컴포넌트를 상세히 설명합니다.

## 프로젝트 개요

**프로젝트명**: Mindthos Web  
**타입**: React + TypeScript 기반 프로덕션급 웹 애플리케이션  
**목적**: 포괄적인 디자인 시스템과 재사용 가능한 UI 컴포넌트 라이브러리 제공  
**기술 스택**: React 19, TypeScript, Vite, Tailwind CSS, Vitest, Playwright,
Storybook

## 프로젝트 개발자

1. 박경선
   - 풀스택 개발자
   - 연차: 3.5년
   - 주요 역할: 아키텍처 설계, 프로젝트 스트럭처 설계, CI/CD 파이프라인 구축
2. 김경민
   - 프론트엔드 개발자
   - 연차: 1년
   - 주요 역할: UI 컴포넌트 개발, 테스트 작성, 문서화

---

## 1. 핵심 인프라 기능

### 1.1 빌드 시스템

- **Vite 7.1.7**: 초고속 개발 서버 및 프로덕션 빌드
- **SWC 컴파일러**: Rust 기반 TypeScript/JavaScript 변환
- **Hot Module Replacement (HMR)**: 실시간 코드 반영
- **Code Splitting**: 라우트 레벨 번들 분리
- **Tree Shaking**: 사용하지 않는 코드 자동 제거

### 1.2 타입 안전성

- **TypeScript Strict Mode**: 엄격한 타입 검증
- **Zod 스키마 검증**: 환경 변수 런타임 검증 (`src/lib/env.ts`)
- **명시적 Props 인터페이스**: 모든 컴포넌트 타입 정의
- **제네릭 타입 지원**: 다형성 컴포넌트 구현

### 1.3 코드 품질 도구

- **ESLint**: 코드 린팅 및 정적 분석
  - `eslint-plugin-jsx-a11y`: 접근성 규칙 검증
  - `eslint-plugin-import`: Import 순서 및 구조 검증
  - `eslint-plugin-react-hooks`: React 19 Hooks 규칙
- **Prettier**: 자동 코드 포맷팅
  - `prettier-plugin-organize-imports`: Import 자동 정렬
  - `prettier-plugin-tailwindcss`: Tailwind 클래스 정렬
- **TypeScript Compiler**: 타입 검사 (`pnpm typecheck`)

### 1.4 테스트 인프라

- **Vitest 4.0.7**: 단위 테스트 프레임워크 (218개 테스트 케이스)
- **React Testing Library 16.3.0**: 컴포넌트 테스트
- **@testing-library/user-event**: 사용자 인터랙션 시뮬레이션
- **vitest-axe**: 자동 접근성 테스트
- **Playwright**: E2E 테스트 프레임워크
- **Storybook 8.6.14**: 컴포넌트 문서화 및 인터랙션 테스트

### 1.5 CI/CD 파이프라인

- **GitHub Actions**: 자동화 워크플로우
- **Pre-commit Hooks**: 로컬 품질 검증
- **Pre-push Validation**: 푸시 전 전체 테스트 실행
- **Coverage Gates**: 80% 커버리지 강제

---

## 2. 디자인 시스템

### 2.1 디자인 토큰 시스템

**파일**: `src/styles/tokens.css`

- **색상 시스템**: CSS Custom Properties 기반
  - Primary/Secondary/Accent/Neutral 톤
  - 라이트/다크 모드 자동 전환
  - Semantic 색상 (bg, fg, border, muted, error, success, warn, info)
- **타이포그래피**:
  - Font Family (Pretendard, Inter, system fonts)
  - Font Sizes (xs ~ 4xl)
  - Font Weights (normal, medium, semibold, bold)
  - Line Heights (tight, normal, relaxed)

- **간격 시스템**: Tailwind 표준 스페이싱
- **Border Radius**: sm, md, lg, xl, 2xl, full
- **Shadow**: xs ~ 2xl, inner
- **Transition**: 150ms ~ 300ms duration

### 2.2 Tailwind 설정

**파일**: `tailwind.config.ts`

- **다크 모드**: Class-based (`dark:` prefix)
- **커스텀 색상**: tokens.css와 연동
- **반응형 브레이크포인트**: sm, md, lg, xl, 2xl
- **커스텀 유틸리티**: 프로젝트별 확장

### 2.3 접근성 표준

- **WCAG 2.1 AA 준수**: 색상 대비율, 키보드 네비게이션
- **ARIA 속성**: 모든 인터랙티브 요소
- **Semantic HTML**: 의미론적 마크업
- **Screen Reader 호환**: aria-label, aria-describedby, role 속성

---

## 3. UI 컴포넌트 라이브러리

### 3.1 Primitives (기본 요소)

#### VisuallyHidden

- **목적**: 스크린 리더 전용 콘텐츠
- **사용 사례**: 접근성 레이블, 설명
- **Props**: children, className

---

### 3.2 Atoms (원자 컴포넌트) - 17개

#### Button

- **변형**: solid, outline, ghost, soft
- **톤**: primary, secondary, accent, neutral
- **크기**: sm, md, lg, free
- **상태**: disabled, loading, with icons
- **기능**:
  - 다형성 (`asChild` prop으로 Link 변환 가능)
  - 좌/우 아이콘 지원
  - 로딩 스피너 자동 표시
  - 접근성: role="button", aria-disabled

#### Input

- **타입**: text, email, password, number, tel, url, search
- **크기**: sm, md, lg
- **톤**: default, primary, secondary, accent, danger
- **변형**: default, filled, outline
- **기능**:
  - Prefix/Suffix 요소 지원
  - 에러 상태 스타일
  - 비활성화 상태
  - Ref forwarding
  - 접근성: aria-invalid, aria-describedby

#### TextArea

- **크기**: sm, md, lg
- **톤**: default, primary, secondary, accent, danger
- **변형**: default, filled, outline
- **기능**:
  - rows 속성으로 높이 조절
  - maxLength 제한
  - 에러 상태
  - 자동 리사이징 (옵션)
  - Ref forwarding

#### CheckBox

- **크기**: sm, md, lg
- **톤**: primary, secondary, accent, neutral
- **변형**: default, outline
- **상태**: checked, unchecked, indeterminate
- **기능**:
  - 라벨 클릭 토글
  - 설명(description) 텍스트
  - 비활성화
  - 접근성: aria-checked, aria-describedby

#### Radio

- **크기**: sm, md, lg
- **톤**: primary, secondary, accent, neutral
- **방향**: horizontal, vertical
- **기능**:
  - 단일 선택 그룹
  - 키보드 네비게이션 (화살표 키)
  - 설명 텍스트
  - 비활성화 옵션
  - 접근성: role="radiogroup", aria-checked

#### Toggle (Switch)

- **크기**: sm, md, lg
- **기능**:
  - On/Off 토글
  - 라벨 텍스트
  - 비활성화
  - Controlled/Uncontrolled 모드
  - 접근성: role="switch", aria-checked

#### Tab

- **크기**: sm, md, lg
- **기능**:
  - 탭 전환 인터페이스
  - 키보드 네비게이션 (화살표, Home, End)
  - 순환 네비게이션
  - 비활성화 탭
  - 접근성: role="tablist", aria-selected

#### Dropdown

- **기능**:
  - 단일 선택 드롭다운
  - 검색/필터링 (typeahead)
  - 키보드 네비게이션
  - 외부 클릭 감지
  - 비활성화 아이템
  - Controlled/Uncontrolled 모드
  - 접근성: role="combobox", aria-expanded

#### Chip (Tag/Badge)

- **톤**: primary, secondary, accent, neutral, info, success, warn, danger
- **크기**: sm, md, lg
- **기능**:
  - 닫기 버튼 (onClose)
  - 아이콘 지원
  - 커스텀 스타일

#### ProgressBar

- **기능**:
  - 0-100% 진행률 표시
  - 불확정(indeterminate) 모드
  - 애니메이션 효과
  - 접근성: role="progressbar", aria-valuenow

#### ProgressCircle

- **크기**: sm, md, lg, xl
- **기능**:
  - 원형 진행률 표시
  - 퍼센트 텍스트
  - SVG 기반 렌더링
  - 커스텀 색상
  - 접근성: role="progressbar"

#### Title (Heading)

- **레벨**: H1, H2, H3, H4
- **기능**:
  - Semantic HTML 태그 사용
  - 일관된 타이포그래피
  - 커스텀 스타일

#### Text (Paragraph)

- **변형**: default, muted, truncate
- **기능**:
  - 다양한 텍스트 스타일
  - 줄임표 처리
  - Semantic HTML (p, span, div)

#### HyperLink (Anchor)

- **밑줄 스타일**: none, hover, always
- **기능**:
  - 내부/외부 링크 구분
  - 외부 링크 아이콘 자동 표시
  - target="\_blank" 시 rel 속성 자동 추가
  - 접근성: 명확한 링크 텍스트

#### DateInput

- **크기**: sm, md, lg
- **기능**:
  - 네이티브 date input
  - min/max 날짜 제한
  - 에러 상태
  - 비활성화

#### Alert

- **톤**: info, success, warn, danger
- **기능**:
  - 제목 및 메시지
  - 아이콘 표시/숨김
  - 커스텀 아이콘
  - 닫기 버튼 (dismissible)
  - onDismiss 콜백
  - 접근성: role="alert"

#### Skeleton (Loading Placeholder)

- **변형**: text, circle, rectangle
- **기능**:
  - 로딩 상태 표시
  - 펄스 애니메이션
  - 커스텀 크기
  - 접근성: aria-busy

---

### 3.3 Composites (복합 컴포넌트) - 20개

#### Card

- **서브컴포넌트**: Card.Header, Card.Body, Card.Footer
- **기능**:
  - 유연한 레이아웃
  - Semantic HTML (div, section, article)
  - 선택적 서브컴포넌트 사용

#### Modal (Dialog)

- **기능**:
  - 제목 및 설명
  - ESC 키로 닫기
  - 배경 클릭 닫기 (옵션)
  - 포커스 트랩
  - body 스크롤 방지
  - Controlled 모드
  - 접근성: aria-modal, focus management

#### Toast (Notification)

- **패턴**: Context + Hook
- **기능**:
  - Provider 설정 필요
  - useToast 훅 사용
  - 제목 및 설명
  - 액션 버튼
  - 자동 닫힘 (커스텀 duration)
  - 다중 토스트 스택
  - 접근성: aria-live

#### Tooltip

- **위치**: top, bottom, left, right
- **기능**:
  - 호버/포커스 시 표시
  - 지연 시간 설정
  - 비활성화 옵션
  - 접근성: aria-describedby

#### Accordion

- **모드**: single, multiple
- **기능**:
  - 접기/펼치기 섹션
  - Controlled/Uncontrolled
  - 비활성화 아이템
  - 접근성: aria-expanded

#### Select

- **모드**: 단일 선택, 다중 선택
- **기능**:
  - 드롭다운 선택
  - 키보드 네비게이션
  - 비활성화 옵션
  - Controlled/Uncontrolled
  - 다중 선택 시 체크박스 표시
  - 선택된 개수 표시
  - 접근성: aria-haspopup, aria-multiselectable

#### Combobox (Autocomplete)

- **기능**:
  - 검색 가능한 드롭다운
  - 실시간 필터링
  - 커스텀 필터 함수
  - 키보드 네비게이션
  - "No results found" 메시지
  - Controlled/Uncontrolled
  - 접근성: role="combobox"

#### Stepper (Progress Indicator)

- **방향**: horizontal, vertical
- **기능**:
  - 다단계 프로세스 표시
  - 완료된 스텝 체크 표시
  - 클릭 가능한 스텝 (옵션)
  - 설명 텍스트
  - 접근성: navigation role

#### Pagination

- **기능**:
  - 페이지 네비게이션
  - 다음/이전 버튼
  - 처음/마지막 버튼 (옵션)
  - 생략 부호(...) 자동 표시
  - siblingCount로 표시 범위 조절
  - 비활성화
  - 접근성: navigation role, aria-current

#### FormField (Form Wrapper)

- **기능**:
  - 라벨 + 입력 필드 조합
  - 필수 표시(\*)
  - 에러 메시지
  - 헬퍼 텍스트
  - 자동 ID 연결 (htmlFor, aria-describedby)
  - 접근성: role="alert" for errors

#### Sidebar (Navigation)

- **기능**:
  - 네비게이션 메뉴
  - 아이콘 + 라벨
  - 활성 항목 강조
  - 비활성화 항목
  - 링크 또는 콜백 모드
  - 접근성: navigation role

#### BreadCrumb

- **기능**:
  - 계층적 네비게이션
  - 아이콘 지원
  - 커스텀 구분자
  - 클릭 핸들러
  - 마지막 항목 강조
  - 접근성: navigation role, aria-current

#### PopUp (Popover)

- **위치**: top, bottom, left, right
- **기능**:
  - 클릭 시 표시
  - ESC/외부 클릭 시 닫기
  - Controlled/Uncontrolled
  - 커스텀 트리거 요소

#### Spinner (Loading Indicator)

- **크기**: xs, sm, md, lg, xl
- **기능**:
  - 로딩 애니메이션
  - 라벨 텍스트 (옵션)
  - 접근성: role="status", aria-live

#### List

- **변형**: unordered, ordered, description
- **기능**:
  - 다양한 리스트 스타일
  - 아이콘/불릿 커스터마이징
  - 중첩 리스트 지원

#### ChatBubble (Message Bubble)

- **변형**: sent, received
- **기능**:
  - 채팅 메시지 UI
  - 발신/수신 구분
  - 타임스탬프
  - 아바타 이미지

#### SnackBar (Bottom Notification)

- **톤**: info, success, warn, danger
- **기능**:
  - 하단 알림 바
  - 액션 버튼
  - 자동 닫힘
  - 수동 닫기
  - 접근성: role="status"

#### Banner (Top Notification)

- **톤**: info, success, warn, danger
- **기능**:
  - 상단 알림 배너
  - 액션 버튼
  - 닫기 버튼
  - 아이콘 표시

#### FootPrint (Breadcrumb Trail)

- **기능**:
  - 사용자 경로 추적
  - 타임스탬프 표시
  - 아이콘 지원

#### TimeStamp (Time Display)

- **형식**: absolute, relative, custom
- **기능**:
  - 시간 표시 컴포넌트
  - 날짜 포맷팅
  - 상대 시간 (예: "2시간 전")

#### AudioPlayer

- **기능**:
  - 오디오 재생 컨트롤
  - 재생/일시정지/중지
  - 볼륨 조절
  - 진행률 바
  - 시간 표시
  - 접근성: 키보드 컨트롤

#### Credit (Usage Display)

- **변형**: default, bar, minimal
- **크기**: sm, md, lg
- **기능**:
  - 사용량/한도 표시
  - 진행률 바
  - 퍼센트 표시
  - 임계치 색상 변경
  - 접근성: role="status"

#### FileDrop (Drag & Drop Upload)

- **기능**:
  - 드래그 앤 드롭 파일 업로드
  - 클릭 업로드
  - 파일 타입 제한
  - 파일 크기 제한
  - 다중 파일 지원
  - 미리보기
  - 접근성: 키보드 업로드 지원

#### Remain (Remaining Count)

- **기능**:
  - 남은 개수/시간 표시
  - 카운트다운
  - 임계치 경고

---

## 4. 유틸리티 함수

### 4.1 cn (className Utils)

**파일**: `src/lib/cn.ts`

- **목적**: clsx + tailwind-merge 조합
- **기능**: 조건부 className 병합 및 중복 제거
- **사용 예시**:

```typescript
cn('px-4 py-2', isActive && 'bg-blue-500', className);
```

### 4.2 env (Environment Validation)

**파일**: `src/lib/env.ts`

- **목적**: Zod를 이용한 환경 변수 검증
- **기능**:
  - 런타임 환경 변수 타입 검증
  - 필수 변수 체크
  - 타입 안전한 환경 변수 접근

---

## 5. 테스트 기능

### 5.1 단위 테스트 (218개 테스트)

**커버리지 목표**:

- Lines: 80% (현재: 90.33%)
- Functions: 80% (현재: 89.95%)
- Statements: 80% (현재: 89.29%)
- Branches: 70% (현재: 81.79%)

**테스트 패턴**:

1. 렌더링 테스트 - 컴포넌트가 크래시 없이 렌더링
2. Props 테스트 - 모든 props 동작 검증
3. 인터랙션 테스트 - 클릭, 타이핑, 키보드 네비게이션
4. 상태 테스트 - Controlled/Uncontrolled 모드
5. Ref 테스트 - forwardRef 동작 확인
6. 접근성 테스트 - vitest-axe로 ARIA 검증

### 5.2 E2E 테스트

**프레임워크**: Playwright  
**테스트 파일**: `tests/e2e/smoke.spec.ts`

**커버리지**:

- 스모크 테스트 - 기본 렌더링 및 네비게이션
- 크리티컬 패스 - 주요 사용자 플로우

### 5.3 Storybook 테스트

**기능**:

- 컴포넌트 카탈로그
- 인터랙션 테스트 (`@storybook/addon-interactions`)
- 접근성 감사 (`@storybook/addon-a11y`)
- 자동 문서 생성 (autodocs)

---

## 6. 개발 워크플로우 기능

### 6.1 개발 스크립트

```bash
pnpm dev              # 개발 서버 (HMR)
pnpm build            # 프로덕션 빌드
pnpm preview          # 빌드 미리보기
pnpm typecheck        # TypeScript 검사
pnpm lint             # ESLint 실행
pnpm lint:fix         # ESLint 자동 수정
pnpm format           # Prettier 포맷팅
pnpm format:check     # 포맷 검증
pnpm test             # 단위 테스트 (watch)
pnpm test:ci          # 단위 테스트 + 커버리지
pnpm test:all         # 전체 검증 (typecheck + lint + test + build + e2e)
pnpm pre-push         # 푸시 전 검증
pnpm e2e              # E2E 테스트
pnpm e2e:ci           # E2E 테스트 (CI)
pnpm storybook        # Storybook 서버
pnpm build-storybook  # Storybook 빌드
pnpm storybook:test   # Storybook 테스트
```

### 6.2 Git 훅

- **Pre-commit**: 포맷 및 린트 체크
- **Pre-push**: 전체 테스트 스위트 실행

### 6.3 CI/CD 자동화

**GitHub Actions 워크플로우**:

1. TypeScript 타입 체크
2. ESLint 검증
3. Prettier 포맷 체크
4. 단위 테스트 + 커버리지
5. 프로덕션 빌드
6. E2E 테스트

---

## 7. 문서화 기능

### 7.1 프로젝트 문서

- **README.md**: 빠른 시작, 스크립트, 구조
- **AGENTS.md**: AI 에이전트 가이드
- **docs/DEVELOPMENT_GUIDE.md**: 개발 프로세스 상세 가이드
- **docs/COMPONENTS_TESTS.md**: 컴포넌트 테스트 문서
- **docs/COMPOSITES_USAGE.md**: 복합 컴포넌트 사용법

### 7.2 코드 문서

- **JSDoc 주석**: 모든 public API
- **TypeScript 타입**: 인라인 문서 역할
- **Storybook**: 인터랙티브 컴포넌트 문서

### 7.3 아키텍처 결정 기록 (ADR)

- **Tailwind v3 선택**: 안정성 및 호환성
- **클래스 기반 다크 모드**: 런타임 전환 용이성
- **CSS 변수 사용**: 런타임 테마 커스터마이징
- **pnpm 사용**: 디스크 효율성 및 속도

---

## 8. 접근성 기능

### 8.1 키보드 네비게이션

- **Tab**: 포커스 이동
- **Enter/Space**: 선택 및 활성화
- **Arrow Keys**: 목록/메뉴 네비게이션
- **Escape**: 모달/드롭다운 닫기
- **Home/End**: 첫/마지막 항목 이동

### 8.2 ARIA 속성

- **role**: button, dialog, tablist, combobox, alert, status 등
- **aria-expanded**: 펼침 상태
- **aria-selected**: 선택 상태
- **aria-checked**: 체크 상태
- **aria-current**: 현재 위치
- **aria-label**: 접근 가능한 이름
- **aria-describedby**: 설명 연결
- **aria-invalid**: 에러 상태
- **aria-live**: 동적 콘텐츠 알림
- **aria-busy**: 로딩 상태
- **aria-modal**: 모달 표시

### 8.3 포커스 관리

- **포커스 트랩**: 모달 내부 포커스 유지
- **포커스 복원**: 모달 닫기 시 원래 위치로
- **포커스 표시**: 명확한 outline
- **Skip Links**: 주요 콘텐츠로 바로 이동

---

## 9. 성능 최적화 기능

### 9.1 번들 최적화

- **Tree Shaking**: 미사용 코드 제거
- **Code Splitting**: 라우트별 분리
- **Lazy Loading**: 필요 시 컴포넌트 로드
- **Dynamic Imports**: 비동기 모듈 로드

### 9.2 렌더링 최적화

- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 메모이제이션
- **Virtual Scrolling**: 대량 데이터 렌더링 (필요 시)

### 9.3 빌드 최적화

- **SWC 컴파일러**: 빠른 변환
- **Vite**: 최적화된 번들링
- **CSS Minification**: 스타일 압축
- **Asset Optimization**: 이미지/폰트 최적화

---

## 10. 보안 기능

### 10.1 환경 변수 보안

- **Zod 검증**: 런타임 타입 안전성
- **.env.local 제외**: Git 저장소에서 제외
- **VITE\_ 접두사**: 클라이언트 노출 변수 명시

### 10.2 XSS 방지

- **React JSX**: 자동 이스케이핑
- **DOMPurify**: 외부 HTML 정제 (필요 시)
- **Content Security Policy**: CSP 헤더 (프로덕션)

### 10.3 의존성 보안

- **pnpm audit**: 취약점 검사
- **Dependabot**: 자동 업데이트
- **신뢰할 수 있는 패키지**: 검증된 라이브러리 사용

---

## 11. 다크 모드 기능

### 11.1 구현 방식

- **클래스 기반**: `dark:` Tailwind 접두사
- **HTML 클래스**: `<html class="dark">`
- **자동 전환**: JavaScript로 클래스 토글

### 11.2 토큰 시스템

- **라이트 모드**: 기본 CSS 변수
- **다크 모드**: `.dark` 스코프 내 재정의
- **자동 적용**: Tailwind가 자동으로 처리

### 11.3 사용자 설정 저장

- **localStorage**: 사용자 선호도 저장
- **시스템 설정 연동**: `prefers-color-scheme` 감지

---

## 12. 반응형 디자인

### 12.1 브레이크포인트

- **sm**: 640px (모바일)
- **md**: 768px (태블릿)
- **lg**: 1024px (소형 데스크톱)
- **xl**: 1280px (데스크톱)
- **2xl**: 1536px (대형 화면)

### 12.2 반응형 패턴

- **Mobile First**: 기본 스타일은 모바일
- **Progressive Enhancement**: 큰 화면에서 추가 기능
- **Flexible Grid**: Flexbox 및 Grid 레이아웃
- **Responsive Typography**: 화면 크기별 폰트 조절

---

## 13. 국제화 (I18n) 준비

### 13.1 현재 상태

- **단일 언어**: 한국어
- **구조 준비**: 텍스트 추출 가능한 구조

### 13.2 향후 확장 가능

- **react-i18next**: 국제화 라이브러리 통합 준비
- **로케일 파일**: JSON 기반 번역 파일
- **RTL 지원**: Right-to-Left 레이아웃 (필요 시)

---

## 14. 상태 관리 (향후 확장)

### 14.1 현재 상태

- **로컬 상태**: useState, useReducer
- **Context**: 전역 상태 공유 (Toast, Theme)

### 14.2 확장 가능

- **Zustand**: 경량 전역 상태 관리
- **React Query**: 서버 상태 관리
- **Redux Toolkit**: 복잡한 상태 로직 (필요 시)

---

## 15. 라우팅 (향후 확장)

### 15.1 준비 사항

- **React Router**: SPA 라우팅
- **Code Splitting**: 라우트별 번들 분리
- **Lazy Loading**: 라우트 컴포넌트 지연 로드

---

## 요약 통계

- **총 컴포넌트 수**: 38개 (Primitives 1 + Atoms 17 + Composites 20)
- **총 테스트 수**: 218개
- **테스트 커버리지**: 평균 89%
- **Storybook 스토리**: 50+ 개
- **지원 브라우저**: Modern browsers (ES2020+)
- **최소 Node 버전**: 20.x
- **패키지 관리자**: pnpm 9.x

---

## 다음 단계 (로드맵)

1. **인증 시스템**: 로그인, 회원가입, 권한 관리
2. **폼 검증**: React Hook Form + Zod 통합
3. **데이터 페칭**: React Query 통합
4. **파일 업로드**: FileDrop 완전 구현
5. **알림 시스템**: 실시간 푸시 알림
6. **테마 커스터마이징**: 사용자 정의 색상 스킴
7. **성능 모니터링**: Web Vitals 추적
8. **에러 바운더리**: 전역 에러 처리
9. **로깅 시스템**: 프론트엔드 로그 수집
10. **A/B 테스트**: 기능 플래그 시스템

---

**마지막 업데이트**: 2025-11-16  
**문서 버전**: 1.0.0
