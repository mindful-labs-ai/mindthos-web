# Composites 컴포넌트 사용 가이드

이 문서는 복잡한 구조를 가진 Composites 컴포넌트들의 사용법을 설명합니다.
Atoms 컴포넌트와 달리, Composites는 특별한 패턴이나 Context, Hook 등을 사용하므로 별도의 사용 가이드가 필요합니다.

---

## 목차

1. [Accordion](#accordion)
2. [Card](#card)
3. [Toast](#toast)
4. [Tooltip](#tooltip)
5. [Modal](#modal)
6. [Select](#select)
7. [Combobox](#combobox)
8. [Stepper](#stepper)
9. [Sidebar](#sidebar)
10. [FormField](#formfield)
11. [BreadCrumb](#breadcrumb)
12. [PopUp](#popup)
13. [Pagination](#pagination)

---

## Accordion

접고 펼칠 수 있는 섹션을 제공하는 컴포넌트입니다.

### 기본 사용법

```tsx
import { Accordion } from '@/components/ui/composites/Accordion';

// Single mode: 한 번에 하나만 열림
<Accordion
  type="single"
  items={[
    { value: '1', header: '섹션 1', content: '콘텐츠 1' },
    { value: '2', header: '섹션 2', content: '콘텐츠 2' },
    { value: '3', header: '섹션 3', content: '콘텐츠 3' },
  ]}
  defaultValue="1"
/>

// Multiple mode: 여러 개 동시에 열림
<Accordion
  type="multiple"
  items={[
    { value: '1', header: '섹션 1', content: '콘텐츠 1' },
    { value: '2', header: '섹션 2', content: '콘텐츠 2' },
  ]}
  defaultValue={['1', '2']}
/>
```

### Controlled Mode

```tsx
const [value, setValue] = useState<string>('1');

<Accordion
  type="single"
  items={items}
  value={value}
  onValueChange={(newValue) => setValue(newValue as string)}
/>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `type` | `'single' \| 'multiple'` | - | 단일/다중 선택 모드 |
| `items` | `AccordionItem[]` | - | 아코디언 아이템 배열 |
| `value` | `string \| string[]` | - | Controlled 값 |
| `defaultValue` | `string \| string[]` | - | Uncontrolled 기본 값 |
| `onValueChange` | `(value) => void` | - | 값 변경 핸들러 |
| `disabled` | `boolean` | - | 비활성화 (아이템별 설정 가능) |

---

## Card

헤더, 바디, 푸터로 구성된 카드 컴포넌트입니다. **서브컴포넌트 패턴**을 사용합니다.

### 기본 사용법

```tsx
import { Card } from '@/components/ui/composites/Card';

<Card>
  <Card.Header>
    <h3>카드 제목</h3>
  </Card.Header>
  <Card.Body>
    <p>카드 내용이 여기에 들어갑니다.</p>
  </Card.Body>
  <Card.Footer>
    <Button>액션</Button>
  </Card.Footer>
</Card>
```

### 선택적 사용

```tsx
// Header와 Footer는 선택적
<Card>
  <Card.Body>
    간단한 카드 내용
  </Card.Body>
</Card>
```

### Semantic HTML

```tsx
// article, section 등으로 변경 가능
<Card as="article">
  <Card.Body>콘텐츠</Card.Body>
</Card>
```

### Props

**Card (Root)**
| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `as` | `'div' \| 'section' \| 'article'` | `'div'` | HTML 요소 타입 |
| `className` | `string` | - | 커스텀 클래스 |

**Card.Header / Card.Body / Card.Footer**
- 모두 표준 `HTMLDivElement` props 지원

---

## Toast

알림 토스트 메시지를 표시하는 컴포넌트입니다. **Context + Hook 패턴**을 사용합니다.

### 설정 (필수)

앱 최상위에 `ToastProvider`를 추가해야 합니다:

```tsx
import { ToastProvider } from '@/components/ui/composites/Toast';

function App() {
  return (
    <ToastProvider>
      {/* 앱 컴포넌트들 */}
    </ToastProvider>
  );
}
```

### 기본 사용법

```tsx
import { useToast } from '@/components/ui/composites/Toast';

function MyComponent() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: '성공!',
      description: '변경사항이 저장되었습니다.',
      duration: 5000, // 5초 후 자동 닫힘
    });
  };

  return <button onClick={handleClick}>저장</button>;
}
```

### 액션 버튼 추가

```tsx
toast({
  title: '파일이 삭제되었습니다',
  description: '이 작업은 취소할 수 없습니다.',
  action: {
    label: '실행 취소',
    onClick: () => {
      // 실행 취소 로직
    },
  },
  duration: 5000,
});
```

### 자동 닫힘 비활성화

```tsx
toast({
  title: '중요한 알림',
  description: '수동으로 닫아야 합니다.',
  duration: 0, // 자동으로 닫히지 않음
});
```

### ToastOptions

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `title` | `string` | - | 토스트 제목 (필수) |
| `description` | `string` | - | 토스트 설명 |
| `action` | `ToastAction` | - | 액션 버튼 |
| `duration` | `number` | `5000` | 자동 닫힘 시간 (ms), 0이면 수동 닫기만 가능 |

---

## Tooltip

호버/포커스 시 정보를 표시하는 툴팁입니다. **Wrapper 패턴**을 사용합니다.

### 기본 사용법

```tsx
import { Tooltip } from '@/components/ui/composites/Tooltip';

<Tooltip content="도움말 텍스트">
  <button>호버해보세요</button>
</Tooltip>
```

### 위치 지정

```tsx
<Tooltip content="위쪽 툴팁" placement="top">
  <button>Top</button>
</Tooltip>

<Tooltip content="아래쪽 툴팁" placement="bottom">
  <button>Bottom</button>
</Tooltip>

<Tooltip content="왼쪽 툴팁" placement="left">
  <button>Left</button>
</Tooltip>

<Tooltip content="오른쪽 툴팁" placement="right">
  <button>Right</button>
</Tooltip>
```

### 지연 시간 조정

```tsx
<Tooltip content="1초 후 표시" delay={1000}>
  <button>Slow tooltip</button>
</Tooltip>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `children` | `ReactElement` | - | 트리거 요소 (하나만) |
| `content` | `ReactNode` | - | 툴팁 내용 |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 툴팁 위치 |
| `delay` | `number` | `200` | 표시 지연 시간 (ms) |
| `disabled` | `boolean` | `false` | 비활성화 |

---

## Modal

모달 다이얼로그 컴포넌트입니다. **Controlled 패턴**을 사용합니다.

### 기본 사용법

```tsx
import { Modal } from '@/components/ui/composites/Modal';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>모달 열기</button>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="모달 제목"
        description="모달 설명"
      >
        <p>모달 내용입니다.</p>
      </Modal>
    </>
  );
}
```

### 배경 클릭으로 닫기

```tsx
<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  closeOnOverlay={true} // 배경 클릭 시 닫힘 (기본값: false)
>
  <p>내용</p>
</Modal>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `open` | `boolean` | - | 열림 상태 (필수, controlled) |
| `onOpenChange` | `(open: boolean) => void` | - | 상태 변경 핸들러 (필수) |
| `title` | `string` | - | 모달 제목 |
| `description` | `string` | - | 모달 설명 |
| `closeOnOverlay` | `boolean` | `false` | 배경 클릭 시 닫기 |
| `children` | `ReactNode` | - | 모달 내용 |

**참고**: 모달이 열리면 자동으로 `body`에 `overflow: hidden`이 적용되어 스크롤이 방지됩니다.

---

## Select

단일/다중 선택 드롭다운 컴포넌트입니다.

### 기본 사용법 (단일 선택)

```tsx
import { Select } from '@/components/ui/composites/Select';

const items = [
  { value: '1', label: '옵션 1' },
  { value: '2', label: '옵션 2' },
  { value: '3', label: '옵션 3' },
];

<Select
  items={items}
  placeholder="옵션을 선택하세요"
  onChange={(value) => console.log(value)}
/>
```

### 다중 선택

```tsx
<Select
  items={items}
  multiple
  placeholder="여러 개 선택 가능"
  onChange={(values) => console.log(values)} // string[]
/>
```

### Controlled Mode

```tsx
// 단일 선택
const [value, setValue] = useState<string>('1');
<Select items={items} value={value} onChange={setValue} />

// 다중 선택
const [values, setValues] = useState<string[]>(['1', '2']);
<Select items={items} multiple value={values} onChange={setValues} />
```

### 비활성화된 옵션

```tsx
const items = [
  { value: '1', label: '옵션 1' },
  { value: '2', label: '옵션 2', disabled: true },
  { value: '3', label: '옵션 3' },
];

<Select items={items} />
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `items` | `SelectItem[]` | - | 선택 항목 배열 |
| `multiple` | `boolean` | `false` | 다중 선택 모드 |
| `value` | `string \| string[]` | - | Controlled 값 |
| `defaultValue` | `string \| string[]` | - | Uncontrolled 기본 값 |
| `onChange` | `(value) => void` | - | 값 변경 핸들러 |
| `placeholder` | `string` | - | 플레이스홀더 |
| `disabled` | `boolean` | `false` | 비활성화 |

---

## Combobox

검색 가능한 자동완성 드롭다운입니다.

### 기본 사용법

```tsx
import { Combobox } from '@/components/ui/composites/Combobox';

const items = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
];

<Combobox
  items={items}
  placeholder="검색하세요..."
  onChange={(value) => console.log(value)}
/>
```

### 커스텀 필터 함수

```tsx
<Combobox
  items={items}
  filterFn={(items, query) => {
    return items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
  }}
/>
```

### Controlled Mode

```tsx
const [value, setValue] = useState<string>('');

<Combobox
  items={items}
  value={value}
  onChange={setValue}
/>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `items` | `ComboboxItem[]` | - | 항목 배열 |
| `value` | `string` | - | Controlled 값 |
| `defaultValue` | `string` | - | Uncontrolled 기본 값 |
| `onChange` | `(value: string) => void` | - | 값 변경 핸들러 |
| `placeholder` | `string` | - | 플레이스홀더 |
| `filterFn` | `(items, query) => items` | - | 커스텀 필터 함수 |
| `disabled` | `boolean` | `false` | 비활성화 |

---

## Stepper

다단계 프로세스 표시 컴포넌트입니다.

### 기본 사용법

```tsx
import { Stepper } from '@/components/ui/composites/Stepper';

const steps = [
  { label: '개인정보', description: '기본 정보 입력' },
  { label: '주소', description: '배송지 정보' },
  { label: '결제', description: '결제 수단 선택' },
  { label: '완료', description: '주문 확인' },
];

<Stepper
  steps={steps}
  currentStep={1} // 0-indexed
/>
```

### 클릭 가능한 Stepper

```tsx
const [currentStep, setCurrentStep] = useState(0);

<Stepper
  steps={steps}
  currentStep={currentStep}
  clickable // 완료된 스텝 클릭 가능
  onStepClick={(step) => setCurrentStep(step)}
/>
```

### 세로 방향

```tsx
<Stepper
  steps={steps}
  currentStep={1}
  orientation="vertical"
/>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `steps` | `Step[]` | - | 스텝 배열 |
| `currentStep` | `number` | - | 현재 스텝 (0-indexed) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 방향 |
| `clickable` | `boolean` | `false` | 완료된 스텝 클릭 가능 여부 |
| `onStepClick` | `(step: number) => void` | - | 스텝 클릭 핸들러 |

---

## Sidebar

네비게이션 사이드바 컴포넌트입니다.

### 기본 사용법

```tsx
import { Sidebar } from '@/components/ui/composites/Sidebar';

const items = [
  {
    icon: <HomeIcon />,
    label: '홈',
    value: 'home'
  },
  {
    icon: <SettingsIcon />,
    label: '설정',
    value: 'settings'
  },
  {
    icon: <UserIcon />,
    label: '프로필',
    value: 'profile',
    disabled: true
  },
];

<Sidebar
  items={items}
  activeValue="home"
  onSelect={(value) => console.log(value)}
/>
```

### 링크로 사용

```tsx
const items = [
  { icon: <HomeIcon />, label: '홈', href: '/' },
  { icon: <AboutIcon />, label: '소개', href: '/about' },
];

<Sidebar items={items} activeValue="/" />
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `items` | `SidebarItem[]` | - | 사이드바 항목 배열 |
| `activeValue` | `string` | - | 현재 활성 항목 |
| `onSelect` | `(value: string) => void` | - | 항목 선택 핸들러 |
| `collapsible` | `boolean` | `false` | 접기 가능 여부 (미구현) |

**SidebarItem**
```typescript
interface SidebarItem {
  icon?: ReactNode;
  label: string;
  href?: string;      // 링크로 사용 시
  value?: string;     // 값으로 사용 시
  disabled?: boolean;
}
```

---

## FormField

폼 입력 필드를 위한 래퍼 컴포넌트입니다. 라벨, 에러, 헬퍼 텍스트를 제공합니다.

### 기본 사용법

```tsx
import { FormField } from '@/components/ui/composites/FormField';
import { Input } from '@/components/ui/atoms/Input';

<FormField
  label="이메일"
  required
  helperText="회사 이메일을 입력하세요"
>
  <Input type="email" />
</FormField>
```

### 에러 표시

```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validateEmail = (value: string) => {
  if (!value.includes('@')) {
    setError('올바른 이메일 형식이 아닙니다');
  } else {
    setError('');
  }
};

<FormField
  label="이메일"
  required
  error={error}
  helperText="example@company.com"
>
  <Input
    type="email"
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      validateEmail(e.target.value);
    }}
  />
</FormField>
```

### TextArea와 함께 사용

```tsx
import { TextArea } from '@/components/ui/atoms/TextArea';

<FormField
  label="설명"
  helperText="최대 500자"
>
  <TextArea rows={5} maxLength={500} />
</FormField>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `label` | `string` | - | 라벨 텍스트 |
| `required` | `boolean` | `false` | 필수 필드 표시 |
| `error` | `string` | - | 에러 메시지 |
| `helperText` | `string` | - | 도움말 텍스트 |
| `children` | `ReactNode` | - | 입력 필드 (Input, TextArea 등) |

**참고**: 에러가 있으면 helperText는 표시되지 않습니다.

---

## BreadCrumb

계층적 네비게이션을 위한 브레드크럼 컴포넌트입니다.

### 기본 사용법

```tsx
import { BreadCrumb } from '@/components/ui/composites/BreadCrumb';

const items = [
  { label: '홈', href: '/' },
  { label: '제품', href: '/products' },
  { label: '카테고리', href: '/products/category' },
  { label: '상품 상세' }, // 마지막 항목은 href 없음
];

<BreadCrumb items={items} />
```

### 아이콘 추가

```tsx
const items = [
  {
    icon: <HomeIcon />,
    label: '홈',
    href: '/'
  },
  { label: '제품', href: '/products' },
  { label: '상품 상세' },
];

<BreadCrumb items={items} />
```

### 커스텀 구분자

```tsx
<BreadCrumb
  items={items}
  separator={<span>→</span>}
/>
```

### 클릭 핸들러

```tsx
<BreadCrumb
  items={items}
  onItemClick={(item, index) => {
    console.log('Clicked:', item.label, 'at index', index);
    // 라우터 네비게이션 등
  }}
/>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `items` | `BreadCrumbItem[]` | - | 브레드크럼 항목 배열 |
| `separator` | `ReactNode` | `<ChevronRightIcon />` | 구분자 |
| `onItemClick` | `(item, index) => void` | - | 항목 클릭 핸들러 |

**BreadCrumbItem**
```typescript
interface BreadCrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}
```

---

## PopUp

클릭 시 표시되는 팝오버 컴포넌트입니다.

### 기본 사용법 (Uncontrolled)

```tsx
import { PopUp } from '@/components/ui/composites/PopUp';

<PopUp
  trigger={<button>클릭</button>}
  content={
    <div>
      <p>팝업 내용</p>
      <button>액션</button>
    </div>
  }
/>
```

### Controlled Mode

```tsx
const [isOpen, setIsOpen] = useState(false);

<PopUp
  trigger={<button>클릭</button>}
  content={<p>팝업 내용</p>}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### 위치 지정

```tsx
<PopUp
  trigger={<button>위</button>}
  content={<p>위쪽 팝업</p>}
  placement="top"
/>

<PopUp
  trigger={<button>아래</button>}
  content={<p>아래쪽 팝업</p>}
  placement="bottom"
/>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `trigger` | `ReactNode` | - | 트리거 요소 |
| `content` | `ReactNode` | - | 팝업 내용 |
| `open` | `boolean` | - | Controlled 열림 상태 |
| `onOpenChange` | `(open: boolean) => void` | - | 상태 변경 핸들러 |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | 팝업 위치 |

**참고**: ESC 키를 누르거나 외부 클릭 시 자동으로 닫힙니다.

---

## Pagination

페이지 네비게이션 컴포넌트입니다.

### 기본 사용법

```tsx
import { Pagination } from '@/components/ui/composites/Pagination';
import { useState } from 'react';

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}
```

### 옵션 설정

```tsx
<Pagination
  currentPage={5}
  totalPages={20}
  onPageChange={handlePageChange}
  siblingCount={2} // 현재 페이지 주변에 보여줄 페이지 수
  showFirstLast={true} // 처음/마지막 버튼 표시
/>
```

### 비활성화

```tsx
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={handlePageChange}
  disabled // 모든 버튼 비활성화
/>
```

### Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `currentPage` | `number` | - | 현재 페이지 (1-indexed) |
| `totalPages` | `number` | - | 총 페이지 수 |
| `onPageChange` | `(page: number) => void` | - | 페이지 변경 핸들러 |
| `siblingCount` | `number` | `1` | 현재 페이지 주변 표시 페이지 수 |
| `showFirstLast` | `boolean` | `true` | 처음/마지막 버튼 표시 |
| `disabled` | `boolean` | `false` | 비활성화 |

**참고**: 페이지가 많을 경우 자동으로 생략 부호(...)가 표시됩니다.

---

## 공통 패턴

### Controlled vs Uncontrolled

대부분의 컴포넌트는 두 가지 모드를 지원합니다:

**Uncontrolled (기본값 사용)**
```tsx
<Select items={items} defaultValue="1" onChange={handleChange} />
```

**Controlled (상태 직접 관리)**
```tsx
const [value, setValue] = useState('1');
<Select items={items} value={value} onChange={setValue} />
```

### Context + Hook 패턴

Toast처럼 Context를 사용하는 컴포넌트는:
1. 최상위에 Provider 추가
2. Hook을 통해 기능 사용

```tsx
// App.tsx
<ToastProvider>
  <App />
</ToastProvider>

// Component.tsx
const { toast } = useToast();
```

### 서브컴포넌트 패턴

Card처럼 `.` 표기법으로 서브컴포넌트를 사용:

```tsx
<Card>
  <Card.Header>헤더</Card.Header>
  <Card.Body>본문</Card.Body>
  <Card.Footer>푸터</Card.Footer>
</Card>
```

### Wrapper 패턴

Tooltip, PopUp처럼 children을 감싸는 패턴:

```tsx
<Tooltip content="도움말">
  <button>버튼</button>
</Tooltip>
```

---

## 접근성 (A11y)

모든 Composites 컴포넌트는 다음을 준수합니다:

- ✅ 적절한 ARIA 속성 (`aria-expanded`, `aria-current`, `aria-describedby` 등)
- ✅ 키보드 네비게이션 (Tab, Enter, Space, Arrow keys, Esc)
- ✅ 포커스 관리 (모달 포커스 트랩, 포커스 복원 등)
- ✅ 스크린 리더 호환 (role 속성, 레이블 등)

---

**최종 업데이트**: 2025-01-11
