# 개발 가이드

이 문서는 Mindthos V2 프로젝트에서 새로운 기능을 개발할 때 따라야 할 프로세스를
설명합니다.

## 개발 프로세스 개요

새로운 컴포넌트나 기능을 개발할 때는 다음 순서를 따릅니다:

```
1. 컴포넌트 구현
2. 타입 정의
3. 테스트 작성
4. Storybook 스토리 작성
5. 검증 및 커밋
```

## 1. 컴포넌트 개발 예제

새로운 UI 컴포넌트를 만든다고 가정하고, 실제 예제를 따라가 봅시다.

### 예제: Input 컴포넌트 만들기

#### Step 1: 컴포넌트 파일 생성

**위치:** `src/components/ui/Input.tsx`

```tsx
import clsx from 'clsx';
import React from 'react';

export interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Input의 크기
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 에러 상태 여부
   */
  hasError?: boolean;
  /**
   * 전체 너비 사용 여부
   */
  fullWidth?: boolean;
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { size = 'md', hasError = false, fullWidth = false, className, ...props },
    ref
  ) => {
    return (
      <input
        ref={ref}
        className={clsx(
          // 기본 스타일
          'rounded-lg border-2 transition-colors duration-200',
          'focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',

          // 배경 및 텍스트 (토큰 사용)
          'bg-bg text-fg',

          // 조건부 스타일
          hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-primary-300 focus:ring-primary-500 dark:border-primary-700',

          // 크기
          sizeMap[size],

          // 너비
          fullWidth ? 'w-full' : '',

          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

**핵심 포인트:**

- ✅ `React.forwardRef` 사용 (ref 전달 가능)
- ✅ TypeScript 타입 정의 (`InputProps`)
- ✅ JSDoc 주석으로 prop 설명
- ✅ CSS 토큰만 사용 (`bg-bg`, `text-fg`, `border-primary-300`)
- ✅ 하드코딩된 색상 없음 (❌ `#3b82f6`)
- ✅ `clsx`로 조건부 className 관리
- ✅ `displayName` 설정

#### Step 2: Export 추가

**위치:** `src/components/ui/index.ts`

```tsx
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';
```

#### Step 3: 테스트 작성

**위치:** `src/components/ui/__tests__/Input.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  it('기본 렌더링이 정상적으로 된다', () => {
    render(<Input placeholder="이름을 입력하세요" />);
    expect(
      screen.getByPlaceholderText('이름을 입력하세요')
    ).toBeInTheDocument();
  });

  it('사용자 입력을 받을 수 있다', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="테스트" />);

    const input = screen.getByPlaceholderText('테스트') as HTMLInputElement;
    await user.type(input, 'Hello World');

    expect(input.value).toBe('Hello World');
  });

  it('onChange 핸들러가 호출된다', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input placeholder="테스트" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('테스트');
    await user.type(input, 'A');

    expect(handleChange).toHaveBeenCalled();
  });

  it('size prop에 따라 다른 크기 클래스를 가진다', () => {
    const { rerender } = render(<Input data-testid="input" size="sm" />);
    let input = screen.getByTestId('input');
    expect(input.className).toContain('px-3');
    expect(input.className).toContain('text-sm');

    rerender(<Input data-testid="input" size="lg" />);
    input = screen.getByTestId('input');
    expect(input.className).toContain('px-5');
    expect(input.className).toContain('text-lg');
  });

  it('hasError가 true일 때 에러 스타일을 가진다', () => {
    render(<Input data-testid="input" hasError />);
    const input = screen.getByTestId('input');
    expect(input.className).toContain('border-red-500');
  });

  it('disabled 상태가 정상 작동한다', () => {
    render(<Input disabled placeholder="비활성화" />);
    const input = screen.getByPlaceholderText('비활성화');
    expect(input).toBeDisabled();
    expect(input.className).toContain('disabled:opacity-60');
  });

  it('fullWidth prop이 작동한다', () => {
    render(<Input data-testid="input" fullWidth />);
    const input = screen.getByTestId('input');
    expect(input.className).toContain('w-full');
  });

  it('ref가 정상적으로 전달된다', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-input">이름</label>
        <Input id="test-input" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**테스트 작성 원칙:**

1. **기본 렌더링** - 컴포넌트가 정상적으로 렌더링되는지
2. **사용자 인터랙션** - 클릭, 타이핑 등의 동작
3. **Props 검증** - 각 prop이 의도대로 작동하는지
4. **상태 변화** - disabled, error 등의 상태
5. **Ref 전달** - forwardRef가 제대로 작동하는지
6. **접근성** - vitest-axe로 a11y 검증

#### Step 4: Storybook 스토리 작성

**위치:** `src/components/ui/Input.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input의 크기',
    },
    hasError: {
      control: 'boolean',
      description: '에러 상태 여부',
    },
    fullWidth: {
      control: 'boolean',
      description: '전체 너비 사용 여부',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    placeholder: '텍스트를 입력하세요',
  },
};

// 크기 변형
export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    placeholder: 'Medium input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

// 상태 변형
export const WithError: Story = {
  args: {
    hasError: true,
    placeholder: '올바르지 않은 값',
    defaultValue: 'invalid@',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: '비활성화됨',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    placeholder: '전체 너비',
  },
  parameters: {
    layout: 'padded',
  },
};

// 실제 사용 예시
export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-2">
      <label htmlFor="email" className="text-fg block text-sm font-medium">
        이메일
      </label>
      <Input
        id="email"
        type="email"
        placeholder="example@email.com"
        {...args}
      />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="w-80 space-y-4">
      <div>
        <label
          htmlFor="name"
          className="text-fg mb-2 block text-sm font-medium"
        >
          이름
        </label>
        <Input id="name" placeholder="홍길동" fullWidth />
      </div>
      <div>
        <label
          htmlFor="email"
          className="text-fg mb-2 block text-sm font-medium"
        >
          이메일
        </label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          fullWidth
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="text-fg mb-2 block text-sm font-medium"
        >
          비밀번호
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          hasError
          fullWidth
        />
        <p className="mt-1 text-sm text-red-500">
          비밀번호는 8자 이상이어야 합니다
        </p>
      </div>
    </form>
  ),
  parameters: {
    layout: 'padded',
  },
};
```

**Storybook 작성 원칙:**

1. **기본 스토리** - Default 스토리는 필수
2. **모든 Variants** - 모든 prop 조합을 스토리로 만들기
3. **실제 사용 예시** - 라벨과 함께, 폼 안에서 등
4. **Controls 설정** - argTypes로 인터랙티브하게 테스트 가능
5. **autodocs** - 자동 문서 생성 활성화

## 2. 개발 워크플로우

### 일반적인 개발 순서

```bash
# 1. 개발 서버 시작
pnpm dev

# 2. 새 브랜치 생성
git checkout -b feat/input-component

# 3. 컴포넌트 개발
# - Input.tsx 작성
# - index.ts에 export 추가

# 4. 테스트 작성 및 실행
pnpm test
# watch 모드에서 Input.test.tsx 작성하며 실시간 확인

# 5. Storybook에서 시각적 확인
pnpm storybook
# http://localhost:6006에서 Input.stories.tsx 작성하며 확인

# 6. 타입 체크
pnpm typecheck

# 7. 린트 및 포맷
pnpm lint:fix
pnpm format

# 8. 최종 검증
pnpm pre-push

# 9. 커밋
git add .
git commit -m "feat: Input 컴포넌트 추가"

# 10. 푸시
git push origin feat/input-component
```

## 3. 체크리스트

새 컴포넌트를 만들 때 다음을 반드시 확인하세요:

### 컴포넌트 코드

- [ ] TypeScript 타입 정의 (`Props` 인터페이스)
- [ ] `React.forwardRef` 사용
- [ ] `displayName` 설정
- [ ] JSDoc 주석으로 prop 설명
- [ ] CSS 토큰만 사용 (하드코딩 색상 금지)
- [ ] `clsx`로 조건부 className 관리
- [ ] `index.ts`에 export 추가

### 테스트

- [ ] 기본 렌더링 테스트
- [ ] 사용자 인터랙션 테스트
- [ ] 모든 props 테스트
- [ ] Ref 전달 테스트
- [ ] 접근성 테스트 (`vitest-axe`)
- [ ] 커버리지 90% 이상

### Storybook

- [ ] Default 스토리
- [ ] 모든 variant 스토리
- [ ] 실제 사용 예시 스토리
- [ ] argTypes 설정
- [ ] autodocs 태그 추가

### 최종 검증

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm test:ci` 통과 (커버리지 90%+)
- [ ] `pnpm build` 성공
- [ ] Storybook에서 시각적 확인

## 4. 자주 하는 실수

### ❌ 하지 말아야 할 것

```tsx
// 1. 하드코딩된 색상 사용
<div className="bg-blue-500 text-white">  // ❌

// 2. Ref 전달 안 함
export const Input = (props: InputProps) => {  // ❌
  return <input {...props} />
}

// 3. displayName 없음
export const Input = React.forwardRef(...)  // ❌
// displayName이 없으면 디버깅 어려움

// 4. 테스트 없음
// 테스트 파일이 아예 없거나 기본 렌더링만 테스트  // ❌

// 5. Storybook 없음
// 컴포넌트만 만들고 스토리 작성 안 함  // ❌
```

### ✅ 올바른 방법

```tsx
// 1. CSS 토큰 사용
<div className="bg-primary-500 text-fg">  // ✅

// 2. Ref 전달
export const Input = React.forwardRef<HTMLInputElement, InputProps>(...)  // ✅

// 3. displayName 설정
Input.displayName = 'Input'  // ✅

// 4. 포괄적인 테스트
describe('Input', () => {
  it('renders correctly', ...)
  it('handles user input', ...)
  it('forwards ref', ...)
  it('has no a11y violations', ...)
})  // ✅

// 5. 다양한 스토리
export const Default: Story = ...
export const WithError: Story = ...
export const FormExample: Story = ...  // ✅
```

## 5. 빠른 참고

### 자주 쓰는 명령어

```bash
# 개발
pnpm dev                  # 개발 서버
pnpm storybook            # Storybook

# 테스트
pnpm test                 # watch 모드
pnpm test:ci              # 1회 실행 + 커버리지

# 검증
pnpm typecheck            # 타입 체크
pnpm lint                 # 린트
pnpm lint:fix             # 린트 자동 수정
pnpm format               # 포맷

# 통합 검증
pnpm pre-push             # 푸시 전 검증
pnpm test:all             # 전체 검증 + E2E
```

### 디렉토리 구조

```
src/components/ui/
├── ComponentName.tsx           # 컴포넌트 구현
├── ComponentName.stories.tsx   # Storybook 스토리
├── __tests__/
│   └── ComponentName.test.tsx  # 테스트
└── index.ts                    # Export
```

## 6. 도움이 되는 리소스

- **Tailwind CSS 문서**: https://tailwindcss.com/docs
- **React Testing Library**: https://testing-library.com/react
- **Storybook 문서**: https://storybook.js.org/docs
- **Vitest 문서**: https://vitest.dev/
- **TypeScript 문서**: https://www.typescriptlang.org/docs

## 7. 질문이 있다면

1. 먼저 기존 `Button` 컴포넌트를 참고하세요
2. 테스트 실패 시 에러 메시지를 자세히 읽기
3. Storybook에서 시각적으로 확인하며 디버깅

---

**핵심 원칙: 코드를 작성하면 반드시 테스트와 스토리도 함께 작성한다!**
