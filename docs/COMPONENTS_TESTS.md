# 컴포넌트 테스트 문서

이 문서는 UI 컴포넌트 라이브러리의 모든 유닛 테스트 개요를 제공합니다.

## 테스트 커버리지

- **프레임워크**: Vitest v4.0.7
- **테스트 라이브러리**: @testing-library/react v16.3.0
- **커버리지 목표**: 80% (lines/functions/statements), 70% (branches)
- **총 컴포넌트 수**: 50+ 개
- **총 테스트 수**: 218 테스트 케이스
- **현재 커버리지**: 89.29% statements, 90.33% lines (목표 초과 달성)

## 테스트 실행

```bash
# 워치 모드 (개발용)
pnpm test

# 단발 실행 + 커버리지 (CI)
pnpm test:ci

# 전체 점검 (typecheck + lint + test + build)
pnpm test:all
```

---

## Atoms 테스트

### Button (`Button.test.tsx`)

- ✅ 크래시 없이 렌더링
- ✅ 사이즈 변형 (sm/md/lg/free)
- ✅ 톤 변형 (primary/secondary/accent/neutral)
- ✅ 비주얼 변형 (solid/outline/ghost/soft)
- ✅ 클릭 이벤트 핸들링
- ✅ 비활성화 상태 (클릭 없음)
- ✅ 로딩 상태 (스피너 + 비활성화)
- ✅ 아이콘 / 오른쪽 아이콘 렌더링
- ✅ asChild 다형성
- ✅ 접근성 (role, disabled 속성)

### Input (`Input.test.tsx`)

- ✅ 텍스트 입력 동작
- ✅ value 및 onChange
- ✅ 제어 컴포넌트 모드
- ✅ prefix/suffix 요소
- ✅ 에러 상태 스타일
- ✅ 비활성화 상태
- ✅ 입력 타입 (email/password/기타)
- ✅ 플레이스홀더 텍스트
- ✅ 접근성 (aria-invalid)

### Radio (`Radio.test.tsx`)

- ✅ 모든 옵션 렌더링
- ✅ 단일 선택 동작
- ✅ onChange로 value 전달
- ✅ 제어 모드
- ✅ 키보드 탐색(화살표 키)
- ✅ 스페이스 키 선택
- ✅ 가로/세로 방향
- ✅ 비활성화 옵션
- ✅ 설명 렌더링
- ✅ 접근성 (role="radiogroup", aria-checked)

### CheckBox (`CheckBox.test.tsx`)

- ✅ 클릭 토글
- ✅ onChange로 checked 상태 전달
- ✅ 제어 모드
- ✅ 불확정(indeterminate) 상태
- ✅ 라벨 클릭 토글
- ✅ 비활성화 상태
- ✅ 설명 렌더링
- ✅ 접근성 (aria-checked)

### Toggle (`Toggle.test.tsx`)

- ✅ switch 역할
- ✅ 클릭 토글
- ✅ onChange 콜백
- ✅ 제어 값
- ✅ 비활성화 상태
- ✅ 라벨 렌더링

### TextArea (`TextArea.test.tsx`)

- ✅ 다중 라인 입력
- ✅ onChange 핸들러
- ✅ rows 속성
- ✅ maxLength 제한
- ✅ 비활성화 상태
- ✅ 에러 스타일

### Tab (`Tab.test.tsx`)

- ✅ 모든 탭 렌더링
- ✅ 클릭 시 탭 전환
- ✅ onValueChange로 탭 값 전달
- ✅ 제어 값
- ✅ 화살표 키 네비게이션 (ArrowLeft/ArrowRight)
- ✅ Home 키로 첫 탭 이동
- ✅ End 키로 마지막 탭 이동
- ✅ 끝에서 처음으로 순환 네비게이션 (ArrowRight)
- ✅ 처음에서 끝으로 순환 네비게이션 (ArrowLeft)
- ✅ 비활성화 탭
- ✅ 커스텀 사이즈(size prop)
- ✅ 커스텀 className
- ✅ 접근성 (tablist, aria-selected)

### Dropdown (`Dropdown.test.tsx`)

- ✅ combobox 역할
- ✅ 플레이스홀더 표시
- ✅ 클릭 시 열림
- ✅ 옵션 선택
- ✅ 선택 후 닫힘
- ✅ 제어 값 (controlled mode)
- ✅ 화살표 키 네비게이션 (ArrowDown/ArrowUp)
- ✅ Enter 키로 선택
- ✅ Space 키로 드롭다운 열기
- ✅ Escape 키로 닫기
- ✅ 타이프어헤드 검색(typeahead)
- ✅ 외부 클릭 시 닫힘
- ✅ 비활성화 아이템 처리
- ✅ defaultValue를 통한 비제어 모드
- ✅ 비활성화 상태

### Chip (`Chip.test.tsx`)

- ✅ 콘텐츠 렌더링
- ✅ 톤 변형
- ✅ 닫기 버튼(onClose 제공 시)
- ✅ onClose 콜백
- ✅ 사용자 정의 className

### ProgressBar (`ProgressBar.test.tsx`)

- ✅ progressbar 역할
- ✅ aria-valuenow 속성
- ✅ value에 따른 너비
- ✅ 불확정 모드
- ✅ 불확정 시 aria-valuenow 없음

### ProgressCircle (`ProgressCircle.test.tsx`)

- ✅ progressbar 역할
- ✅ aria-valuenow
- ✅ SVG 렌더링
- ✅ 퍼센트 텍스트 표시
- ✅ 사이즈 변형

### Title (`Title.test.tsx`)

- ✅ H1–H4 레벨 렌더링
- ✅ 올바른 HTML 태그 사용
- ✅ 콘텐츠 렌더링

### Text (`Text.test.tsx`)

- ✅ 콘텐츠 렌더링
- ✅ muted 스타일
- ✅ 줄임표(truncate) 스타일
- ✅ 사용자 정의 className

### HyperLink (`HyperLink.test.tsx`)

- ✅ a 요소와 href
- ✅ 외부 링크 (target="\_blank", rel)
- ✅ 외부 아이콘 렌더링
- ✅ 밑줄(underline) 변형
- ✅ 콘텐츠 렌더링

### DateInput (`DateInput.test.tsx`)

- ✅ date 입력 타입
- ✅ 날짜 값 수용
- ✅ onChange 핸들러
- ✅ min/max 속성
- ✅ 비활성화 상태

### Alert (`Alert.test.tsx`)

- ✅ 콘텐츠 렌더링
- ✅ role="alert"
- ✅ 제목 렌더링
- ✅ 톤 변형 (info/success/warn/danger)
- ✅ 아이콘 표시/숨김
- ✅ 커스텀 아이콘
- ✅ 닫기 가능(dismissible) 버튼
- ✅ onDismiss 콜백

### Skeleton (`Skeleton.test.tsx`)

- ✅ 크래시 없이 렌더링
- ✅ aria-busy 속성
- ✅ 변형 스타일 (text/circle/rectangle)
- ✅ 커스텀 크기
- ✅ 펄스 애니메이션

---

## Composites 테스트

### Pagination (`Pagination.test.tsx`)

- ✅ navigation 역할
- ✅ 페이지 번호 렌더링
- ✅ 현재 페이지 강조 (aria-current)
- ✅ 페이지 클릭 콜백
- ✅ 다음/이전 네비게이션
- ✅ 비활성화 상태(첫/마지막 페이지)
- ✅ 많은 페이지 시 생략부호(…)
- ✅ 첫/마지막 페이지 버튼

### FormField (`FormField.test.tsx`)

- ✅ 라벨 렌더링
- ✅ 필수 표시(\*)
- ✅ 에러 메시지 표시
- ✅ 에러 role="alert"
- ✅ 헬퍼 텍스트 표시
- ✅ 에러 발생 시 헬퍼 텍스트 숨김
- ✅ 라벨-인풋 연결(htmlFor)
- ✅ aria-describedby 연결

### Stepper (`Stepper.test.tsx`)

- ✅ 모든 스텝 렌더링
- ✅ 현재 스텝 강조
- ✅ 완료된 스텝 체크 아이콘
- ✅ 설명 렌더링
- ✅ 완료된 스텝 클릭 가능
- ✅ onStepClick 콜백
- ✅ 가로/세로 방향
- ✅ navigation 역할

### Modal (`Modal.test.tsx`)

- ✅ 열림 상태에서 렌더링
- ✅ 닫힘 상태에서 숨김
- ✅ aria-modal 속성
- ✅ ESC 키로 닫힘
- ✅ closeOnOverlay prop에 따른 배경 클릭 처리
  - ✅ closeOnOverlay=true일 때 배경 클릭 시 닫힘
  - ✅ closeOnOverlay=false일 때 배경 클릭 무시
- ✅ 제목(title prop) 렌더링
- ✅ 설명(description prop) 렌더링
- ✅ 콘텐츠 렌더링
- ✅ 닫기 버튼 클릭 처리
- ✅ 모달 열릴 때 body 스크롤 방지 (overflow:hidden)
- ✅ onOpenChange 콜백 호출
- ✅ 포커스 트랩 동작

### Select (`Select.test.tsx`)

- ✅ combobox 속성 (aria-haspopup="listbox")
- ✅ 플레이스홀더 표시
- ✅ 드롭다운 열림
- ✅ 단일 선택 모드
- ✅ 다중 선택 모드
  - ✅ 선택된 개수 표시 (예: "2 selected")
  - ✅ 체크박스 표시 (aria-multiselectable)
  - ✅ 배열 value 처리
- ✅ Enter 키로 선택
- ✅ Escape 키로 닫기
- ✅ 외부 클릭 시 닫힘
- ✅ 화살표 키 네비게이션
- ✅ 비활성화 아이템 처리
- ✅ defaultValue를 통한 비제어 모드
- ✅ 비활성화 상태

### Combobox (`Combobox.test.tsx`)

- ✅ combobox 역할
- ✅ 플레이스홀더
- ✅ 검색 필터링
- ✅ 항목 선택
- ✅ "No results found" 메시지
- ✅ Enter 키로 선택
- ✅ Escape 키로 닫기
- ✅ 외부 클릭 시 닫힘
- ✅ 화살표 키 네비게이션 (ArrowDown/ArrowUp)
- ✅ 비활성화 아이템 처리
- ✅ 커스텀 필터 함수 (filterFn prop)
- ✅ 닫힌 상태에서 클릭 시 입력 초기화 및 모든 항목 표시
- ✅ 제어 값 처리 (controlled value)
- ✅ 비활성화 상태

### Tooltip (`Tooltip.test.tsx`)

- ✅ 호버 시 표시
- ✅ 포커스 시 표시
- ✅ 위치 변형 (top/bottom/left/right)
- ✅ 지연 시간
- ✅ aria-describedby
- ✅ 비활성화 상태

### Card (`Card.test.tsx`)

- ✅ Header/Body/Footer 서브컴포넌트
- ✅ 중첩 구조
- ✅ className 오버라이드

### Toast (`Toast.test.tsx`)

- ✅ useToast 훅
- ✅ ToastProvider 컨텍스트
- ✅ 토스트 추가/제거
- ✅ 자동 숨김 시간
- ✅ 수동 닫기
- ✅ 다중 토스트 스택
- ✅ aria-live

### Accordion (`Accordion.test.tsx`)

- ✅ 패널 열기/닫기
- ✅ 단일 모드(하나만 열림)
- ✅ 다중 모드(여러 개 열림)
- ✅ 키보드 네비게이션
- ✅ aria-expanded

### BreadCrumb (`BreadCrumb.test.tsx`)

- ✅ 경로 아이템 렌더링
- ✅ 구분자 표시
- ✅ 마지막 아이템 aria-current
- ✅ 클릭 이벤트
- ✅ navigation 역할

### Credit (`Credit.test.tsx`)

- ✅ 사용량 표시(used/total)
- ✅ 변형 렌더링 (default/bar/minimal)
- ✅ 사이즈 변형
- ✅ 임계치에 따른 자동 색상 변경
- ✅ 퍼센트 표시
- ✅ role="status"

---

## 테스트 패턴

### 공통 테스트 구조

모든 컴포넌트 테스트는 다음 패턴을 따릅니다:

1. **렌더링 테스트**: 컴포넌트가 크래시 없이 렌더링되는지 확인
2. **Props 테스트**: 모든 props가 올바르게 적용되는지 확인
3. **상호작용 테스트**: 클릭, 키보드, 호버 이벤트
4. **상태 테스트**: 제어/비제어 모드
5. **접근성 테스트**: ARIA 속성, 키보드 네비게이션
6. **엣지 케이스**: 비활성화, 에러, 빈 상태

### 접근성 테스트

모든 컴포넌트는 다음을 포함합니다:

- ✅ 시맨틱 HTML 요소
- ✅ ARIA 속성 (role, aria-\*)
- ✅ 키보드 네비게이션 지원
- ✅ 스크린 리더 호환성

### 예시 테스트 패턴

```typescript
describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<Component>Content</Component>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Component onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('is accessible', () => {
    render(<Component />);
    expect(screen.getByRole('expected-role')).toBeInTheDocument();
  });
});
```

---

## 커버리지 목표

| 구분       | 목표 | 현재   | 상태 |
| ---------- | ---- | ------ | ---- |
| Lines      | 80%  | 90.33% | ✅   |
| Functions  | 80%  | 89.95% | ✅   |
| Statements | 80%  | 89.29% | ✅   |
| Branches   | 70%  | 81.79% | ✅   |

---

## CI/CD 연동

테스트는 다음 시점에 자동 실행됩니다:

- ✅ Pre-push 훅 (`pnpm pre-push`)
- ✅ CI 파이프라인 (`pnpm test:ci`)
- ✅ Pull Request (GitHub Actions)

---

## 향후 개선 항목

- [ ] Playwright 기반 E2E 테스트
- [ ] 비주얼 리그레션 테스트
- [ ] 성능 벤치마크
- [ ] 통합(Integration) 테스트
- [ ] 접근성 감사(a11y, axe-core)

---

**최종 업데이트**: 2025-01-11
