# Router 구조

애플리케이션의 라우팅 설정을 관리합니다.

## 파일 구조

```
router/
├── index.tsx           # 메인 라우터 설정
├── constants.ts        # 라우트 경로 상수
├── layouts/            # 레이아웃 컴포넌트
│   └── RootLayout.tsx  # 루트 레이아웃 (공통 헤더/푸터 등)
└── README.md           # 이 파일
```

## 설계 원칙

### 1. 중첩 라우트 (Nested Routes)

- `RootLayout`을 부모로 사용하여 모든 페이지에 공통 설정 적용
- `errorElement`는 루트에서 한 번만 정의하여 중복 제거

### 2. 경로 중앙 관리

- 모든 경로는 `constants.ts`에 정의
- 하드코딩된 문자열 대신 상수 사용으로 타입 안전성 확보

### 3. 선언적 구조

- 주석으로 TODO 표시
- 간결한 children 배열로 가독성 향상

## 사용 예시

### 경로 상수 사용

```tsx
import { ROUTES } from '@/router/constants';

// ❌ 하드코딩
navigate('/auth');

// ✅ 상수 사용
navigate(ROUTES.AUTH);
```

### 새 라우트 추가

1. `constants.ts`에 경로 추가
2. `index.tsx`의 children 배열에 라우트 설정 추가

```tsx
// 1. constants.ts
export const ROUTES = {
  // ...
  DASHBOARD: '/dashboard',
} as const;

// 2. index.tsx
{
  path: ROUTES.DASHBOARD,
  element: <DashboardPage />,
}
```

## 향후 개선 사항

- [ ] Protected Route 래퍼 구현
- [ ] 인증 상태 체크 loader 추가
- [ ] 레이아웃별 그룹화 (인증 필요/불필요)
