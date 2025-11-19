# UI Component Library Specification

**Project**: Mindthos Web  
**Version**: 1.0.0  
**Last Updated**: 2025-11-16  
**Status**: Active Development

---

## 1. Overview

### 1.1 Purpose

Provide a comprehensive, production-ready UI component library built with React
19, TypeScript, and Tailwind CSS. The library emphasizes accessibility (WCAG 2.1
AA), type safety, testing, and developer experience.

### 1.2 Goals

- **Consistency**: Unified design language across all components
- **Accessibility**: 100% keyboard navigable, ARIA compliant
- **Type Safety**: Full TypeScript coverage with strict mode
- **Test Coverage**: 80%+ unit test coverage, comprehensive E2E tests
- **Developer Experience**: Clear documentation, Storybook examples, intuitive
  APIs
- **Performance**: Optimized builds, lazy loading, minimal bundle size

### 1.3 Non-Goals

- Framework-agnostic components (React only)
- CSS-in-JS solutions (Tailwind CSS only)
- Runtime theming API (design tokens via CSS variables)

---

## 2. Technical Architecture

### 2.1 Component Hierarchy

```
src/components/ui/
├── primitives/        # Base accessibility wrappers
│   └── VisuallyHidden
├── atoms/             # Single-responsibility components (17)
│   ├── Button
│   ├── Input
│   ├── CheckBox
│   └── ...
└── composites/        # Multi-part components (20)
    ├── Modal
    ├── Select
    ├── Accordion
    └── ...
```

**Rationale**: Clear separation of concerns enables better reusability and
maintainability.

### 2.2 Design Token System

**Location**: `src/styles/tokens.css`

**Structure**:

```css
:root {
  /* Semantic Colors */
  --color-bg: hsl(0, 0%, 100%);
  --color-fg: hsl(222, 47%, 11%);
  --color-primary-500: hsl(222, 47%, 50%);

  /* Typography */
  --font-family-base: 'Pretendard', 'Inter', system-ui;
  --font-size-sm: 0.875rem;

  /* Spacing - follows Tailwind */
  /* Border Radius */
  /* Shadows */
  /* Transitions */
}

.dark {
  --color-bg: hsl(222, 47%, 11%);
  --color-fg: hsl(0, 0%, 100%);
  /* ... dark mode overrides */
}
```

**Requirements**:

- All components MUST use design tokens
- NO hardcoded colors (e.g., `#3b82f6`)
- Dark mode via `.dark` class scope
- Tokens accessible via Tailwind utilities

### 2.3 Type System

**Pattern**: Explicit TypeScript interfaces for all props

```typescript
export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * Visual style variant
   */
  variant?: 'solid' | 'outline' | 'ghost' | 'soft';

  /**
   * Color tone
   */
  tone?: 'primary' | 'secondary' | 'accent' | 'neutral';

  /**
   * Size preset
   */
  size?: 'sm' | 'md' | 'lg' | 'free';

  /**
   * Loading state with spinner
   */
  isLoading?: boolean;

  /**
   * Polymorphic component support
   */
  asChild?: boolean;
}
```

**Requirements**:

- JSDoc comments for all public props
- Union types for variants (prevents typos)
- Extends native HTML element props
- Generic types for polymorphism where applicable

---

## 3. Component Specifications

### 3.1 Atoms

#### 3.1.1 Button

**Purpose**: Primary interaction element for user actions

**Variants**:

- `solid` (default): Filled background
- `outline`: Border only
- `ghost`: No background, hover effect
- `soft`: Subtle background

**Tones**: `primary` | `secondary` | `accent` | `neutral`

**Sizes**: `sm` | `md` (default) | `lg` | `free`

**States**:

- Default
- Hover
- Focus (keyboard navigation)
- Active (pressed)
- Disabled
- Loading (with spinner)

**API**:

```typescript
<Button
  variant="solid"
  tone="primary"
  size="md"
  isLoading={false}
  disabled={false}
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  asChild={false}
  onClick={handleClick}
>
  Click Me
</Button>
```

**Accessibility**:

- `role="button"` (when `asChild` transforms element)
- `aria-disabled="true"` when disabled
- `aria-busy="true"` when loading
- Keyboard: Enter/Space to activate
- Focus visible outline

**Tests Required**:

- ✅ Renders without crash
- ✅ All variant combinations
- ✅ All tone combinations
- ✅ All size combinations
- ✅ Click handler called
- ✅ Disabled prevents clicks
- ✅ Loading shows spinner
- ✅ Icons render correctly
- ✅ asChild polymorphism
- ✅ Ref forwarding
- ✅ Zero accessibility violations

---

#### 3.1.2 Input

**Purpose**: Single-line text input with validation states

**Variants**: `default` | `filled` | `outline`

**Tones**: `default` | `primary` | `secondary` | `accent` | `danger`

**Sizes**: `sm` | `md` (default) | `lg`

**Features**:

- Prefix/Suffix slots (icons, text)
- Error state styling
- Disabled state
- All native input types supported

**API**:

```typescript
<Input
  type="email"
  size="md"
  tone="default"
  variant="default"
  prefix={<Icon />}
  suffix={<Icon />}
  error={false}
  disabled={false}
  placeholder="Enter email"
  value={value}
  onChange={handleChange}
  ref={inputRef}
/>
```

**Accessibility**:

- `aria-invalid="true"` when error
- `aria-describedby` for error messages
- Label association (via FormField)
- Keyboard: Standard input behavior

**Validation Integration**:

```typescript
// Pairs with FormField
<FormField
  label="Email"
  required
  error={errors.email}
>
  <Input type="email" error={!!errors.email} />
</FormField>
```

**Tests Required**:

- ✅ All variants, tones, sizes
- ✅ User can type
- ✅ onChange called
- ✅ Prefix/suffix render
- ✅ Error state styles
- ✅ Disabled prevents input
- ✅ Ref forwarding
- ✅ Zero a11y violations

---

#### 3.1.3 CheckBox

**Purpose**: Multi-select option control

**States**: `checked` | `unchecked` | `indeterminate`

**Sizes**: `sm` | `md` (default) | `lg`

**Tones**: `primary` | `secondary` | `accent` | `neutral`

**Variants**: `default` | `outline`

**API**:

```typescript
<CheckBox
  checked={isChecked}
  indeterminate={isIndeterminate}
  onChange={handleChange}
  disabled={false}
  size="md"
  tone="primary"
  label="Accept terms"
  description="Read our terms and conditions"
/>
```

**Accessibility**:

- `role="checkbox"`
- `aria-checked="true|false|mixed"`
- `aria-describedby` for description
- Keyboard: Space to toggle
- Label click toggles

**Tests Required**:

- ✅ Click toggles state
- ✅ onChange receives boolean
- ✅ Controlled mode
- ✅ Indeterminate state
- ✅ Label click works
- ✅ Disabled prevents toggle
- ✅ Description renders
- ✅ Zero a11y violations

---

### 3.2 Composites

#### 3.2.1 Modal

**Purpose**: Focus user attention on critical content/actions

**Pattern**: Controlled component (parent manages open state)

**API**:

```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirm Action"
  description="This action cannot be undone"
  closeOnOverlay={false}
>
  <p>Modal content goes here</p>
  <div className="flex gap-2">
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </div>
</Modal>
```

**Behavior**:

- ESC key closes modal
- Background overlay (optional click-to-close)
- Focus trap (Tab cycles within modal)
- Body scroll lock (prevents background scrolling)
- Focus restoration (returns to trigger element)

**Accessibility**:

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` → title
- `aria-describedby` → description
- Focus moves to first focusable element
- Keyboard: ESC to close, Tab/Shift+Tab to navigate

**Visual Behavior**:

- Fade-in animation (200ms)
- Background overlay darkens
- Modal centered on screen
- Responsive: full-screen on mobile

**Tests Required**:

- ✅ Renders when open
- ✅ Hidden when closed
- ✅ ESC closes modal
- ✅ Overlay click behavior (controlled by prop)
- ✅ Title and description render
- ✅ Body scroll prevented
- ✅ onOpenChange called
- ✅ Focus trap works
- ✅ Focus restoration
- ✅ Zero a11y violations

---

#### 3.2.2 Select

**Purpose**: Single or multi-select dropdown

**Modes**: `single` (default) | `multiple`

**API**:

```typescript
// Single Select
<Select
  items={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2', disabled: true },
  ]}
  value={selectedValue}
  onChange={setValue}
  placeholder="Select option"
  disabled={false}
/>

// Multiple Select
<Select
  multiple
  items={items}
  value={selectedValues} // string[]
  onChange={setValues}
  placeholder="Select multiple"
/>
```

**Behavior**:

- Click/Space opens dropdown
- Arrow keys navigate options
- Enter selects focused option
- ESC closes dropdown
- Typeahead search (type to find)
- Outside click closes
- Multiple mode: checkboxes shown, count badge

**Accessibility**:

- `role="combobox"`
- `aria-haspopup="listbox"`
- `aria-expanded="true|false"`
- `aria-activedescendant` for keyboard nav
- `aria-multiselectable="true"` in multiple mode
- Keyboard: full navigation support

**Visual States**:

- Closed: Shows placeholder or selected value
- Open: Dropdown expands below/above
- Multiple: "X selected" badge
- Disabled items: Muted, not selectable

**Tests Required**:

- ✅ Opens on click
- ✅ Single selection works
- ✅ Multiple selection works
- ✅ Keyboard navigation (arrows, Enter, ESC)
- ✅ Typeahead search
- ✅ Outside click closes
- ✅ Disabled items not selectable
- ✅ Controlled/Uncontrolled modes
- ✅ Zero a11y violations

---

#### 3.2.3 Toast

**Purpose**: Non-blocking notification system

**Pattern**: Context + Hook

**Setup** (required):

```typescript
// App root
<ToastProvider>
  <App />
</ToastProvider>
```

**Usage**:

```typescript
const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Your changes have been saved',
  duration: 5000, // 0 = no auto-dismiss
  action: {
    label: 'Undo',
    onClick: handleUndo,
  },
});
```

**Behavior**:

- Appears in corner (top-right default)
- Stacks multiple toasts
- Auto-dismisses after duration
- Manual close button
- Swipe to dismiss (mobile)
- Animation: slide in/out

**Accessibility**:

- `role="status"` (polite announcement)
- `aria-live="polite"`
- `aria-atomic="true"`
- Focus remains on trigger (non-modal)

**Tests Required**:

- ✅ Toast appears
- ✅ Auto-dismisses after duration
- ✅ Manual close works
- ✅ Action button calls onClick
- ✅ Multiple toasts stack
- ✅ Zero a11y violations

---

#### 3.2.4 FormField

**Purpose**: Label + Input wrapper with validation

**API**:

```typescript
<FormField
  label="Email Address"
  required={true}
  error={errors.email}
  helperText="We'll never share your email"
>
  <Input
    type="email"
    error={!!errors.email}
  />
</FormField>
```

**Behavior**:

- Automatically generates unique IDs
- Connects label to input (`htmlFor`)
- Connects error message (`aria-describedby`)
- Shows helper text when no error
- Shows error message when error present
- Required indicator (asterisk)

**Accessibility**:

- `<label>` with `htmlFor`
- `aria-describedby` for helper/error
- Error: `role="alert"`
- Required: `aria-required="true"` on input

**Visual Layout**:

```
Label (required*)
[Input Field]
Helper text or Error message
```

**Tests Required**:

- ✅ Label renders
- ✅ Required indicator shows
- ✅ Error message renders
- ✅ Helper text renders (when no error)
- ✅ Error has role="alert"
- ✅ IDs connected (htmlFor, aria-describedby)
- ✅ Zero a11y violations

---

## 4. Testing Requirements

### 4.1 Unit Tests (Vitest + RTL)

**Coverage Thresholds**:

```json
{
  "lines": 80,
  "functions": 80,
  "statements": 80,
  "branches": 70
}
```

**Test Structure** (mandatory for all components):

```typescript
describe('ComponentName', () => {
  // 1. Rendering
  it('renders without crashing', () => {});

  // 2. Props
  it('applies all variants correctly', () => {});
  it('applies all sizes correctly', () => {});
  it('applies all tones correctly', () => {});

  // 3. Interactions
  it('handles user click', async () => {});
  it('handles keyboard input', async () => {});

  // 4. States
  it('shows disabled state', () => {});
  it('shows loading state', () => {});
  it('shows error state', () => {});

  // 5. Ref Forwarding
  it('forwards ref correctly', () => {});

  // 6. Accessibility
  it('has no accessibility violations', async () => {
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 4.2 E2E Tests (Playwright)

**Critical Paths**:

- Form submission workflows
- Multi-step processes (Stepper)
- Modal interactions
- Navigation patterns

**Example**:

```typescript
test('user can submit contact form', async ({ page }) => {
  await page.goto('/contact');

  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="message"]', 'Hello world');

  await page.click('button[type="submit"]');

  await expect(page.locator('.toast')).toContainText('Message sent');
});
```

### 4.3 Storybook Tests

**Required for all components**:

```typescript
// Button.stories.tsx
export default {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', ...] },
    // ... all props
  },
} satisfies Meta<typeof Button>;

export const Default: Story = {
  args: { children: 'Button' },
};

export const AllVariants: Story = {
  render: () => (
    <>
      <Button variant="solid">Solid</Button>
      <Button variant="outline">Outline</Button>
      {/* ... */}
    </>
  ),
};

// Interaction test
export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Clicked')).toBeInTheDocument();
  },
};
```

---

## 5. Accessibility Requirements

### 5.1 Keyboard Navigation

**All interactive components MUST support**:

- `Tab` / `Shift+Tab`: Focus movement
- `Enter` / `Space`: Activation
- `Arrow Keys`: List/menu navigation
- `Escape`: Close modals/dropdowns
- `Home` / `End`: Jump to first/last item

### 5.2 ARIA Attributes

**Required patterns**:

```typescript
// Button
<button role="button" aria-disabled="true">

// Modal
<div role="dialog" aria-modal="true" aria-labelledby="title" aria-describedby="desc">

// Select
<div role="combobox" aria-expanded="false" aria-haspopup="listbox">

// Tabs
<div role="tablist">
  <button role="tab" aria-selected="true">

// Alert
<div role="alert">

// Status
<div role="status" aria-live="polite">
```

### 5.3 Focus Management

**Requirements**:

- Focus indicators MUST be visible
- Focus order MUST be logical
- Modals MUST trap focus
- Modals MUST restore focus on close
- Skip links for main content

### 5.4 Screen Reader Support

**Testing tools**:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)

**Verification**:

- All interactive elements announced
- States communicated (checked, expanded, etc.)
- Error messages read aloud
- Dynamic content updates announced

---

## 6. Performance Requirements

### 6.1 Bundle Size

**Thresholds**:

- Total library: < 100KB gzipped
- Individual component: < 10KB gzipped
- Tree-shaking: Unused components excluded

**Monitoring**:

```bash
pnpm build
pnpm analyze-bundle
```

### 6.2 Runtime Performance

**Requirements**:

- Initial render: < 100ms (desktop)
- Re-render: < 16ms (60fps)
- Large lists: Virtual scrolling for 1000+ items
- Memoization: `React.memo` for expensive components

### 6.3 Build Performance

**Targets**:

- Development build: < 5 seconds
- Production build: < 30 seconds
- HMR: < 500ms

---

## 7. Documentation Requirements

### 7.1 Component Documentation

**Each component MUST have**:

1. **JSDoc comments** on all props
2. **README** section in main docs
3. **Storybook stories**:
   - Default story
   - All variants
   - All states
   - Real-world examples
4. **Usage examples** in code

### 7.2 API Documentation

**Generated via TypeScript + Storybook autodocs**

**Example output**:

```markdown
## Button

### Props

| Prop      | Type                                      | Default   | Description          |
| --------- | ----------------------------------------- | --------- | -------------------- |
| variant   | 'solid' \| 'outline' \| 'ghost' \| 'soft' | 'solid'   | Visual style         |
| tone      | 'primary' \| 'secondary' \| ...           | 'primary' | Color tone           |
| size      | 'sm' \| 'md' \| 'lg'                      | 'md'      | Size preset          |
| isLoading | boolean                                   | false     | Show loading spinner |

### Examples

#### Basic

\`\`\`tsx <Button onClick={handleClick}>Click me</Button> \`\`\`

#### With Icon

\`\`\`tsx <Button leftIcon={<Icon />}>Save</Button> \`\`\`
```

---

## 8. Release & Versioning

### 8.1 Semantic Versioning

**Format**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking API changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### 8.2 Changelog

**Format** (CHANGELOG.md):

```markdown
## [1.2.0] - 2025-11-16

### Added

- Button: New `soft` variant
- Select: Multiple selection mode

### Changed

- Input: Improved focus styles

### Fixed

- Modal: Focus trap on Safari

### Breaking Changes

- Removed deprecated `Button.variant="link"`
```

### 8.3 Deprecation Policy

**Process**:

1. Mark as deprecated in TypeScript (`@deprecated`)
2. Add console warning in development
3. Document migration path
4. Remove in next MAJOR version (minimum 3 months)

---

## 9. Quality Gates

### 9.1 Pre-commit

```bash
✓ pnpm typecheck
✓ pnpm lint
✓ pnpm format
✓ pnpm test (affected files)
```

### 9.2 Pre-push

```bash
✓ pnpm test:ci (full coverage)
✓ pnpm build
```

### 9.3 Pull Request

**Automated checks**:

- ✓ All unit tests pass
- ✓ Coverage ≥ 80%
- ✓ No TypeScript errors
- ✓ No ESLint errors
- ✓ Build succeeds
- ✓ E2E tests pass (if applicable)

**Manual review**:

- ✓ Code follows conventions
- ✓ Tests are comprehensive
- ✓ Accessibility verified
- ✓ Storybook stories added
- ✓ Documentation updated

---

## 10. Migration Guides

### 10.1 From Other Libraries

**Material-UI → Mindthos**:

```typescript
// Before (MUI)
<Button variant="contained" color="primary">
  Click
</Button>

// After (Mindthos)
<Button variant="solid" tone="primary">
  Click
</Button>
```

**Chakra UI → Mindthos**:

```typescript
// Before (Chakra)
<Button colorScheme="blue" size="md">
  Click
</Button>

// After (Mindthos)
<Button tone="primary" size="md">
  Click
</Button>
```

---

## 11. Future Enhancements

### 11.1 Planned Components

- [ ] DataTable (sortable, filterable)
- [ ] DatePicker (calendar UI)
- [ ] FileUploader (drag-drop)
- [ ] RichTextEditor (WYSIWYG)
- [ ] Charts (graphs, visualizations)

### 11.2 Planned Features

- [ ] Theming API (runtime customization)
- [ ] CSS-in-JS variant (styled-components)
- [ ] React Native support
- [ ] Vue/Svelte adapters
- [ ] Figma plugin (sync designs)

---

## Appendix A: Decision Records

### A.1 Why Tailwind CSS?

- **Pros**: Utility-first, excellent DX, built-in purge, consistent spacing
- **Cons**: Learning curve, verbose classes
- **Decision**: Benefits outweigh drawbacks for this project

### A.2 Why Class-based Dark Mode?

- **Alternatives**: CSS media query, data attributes
- **Rationale**: User control, localStorage integration, no flash of wrong theme
- **Decision**: `<html class="dark">` approach

### A.3 Why Radix UI Primitives?

- **Alternatives**: Build from scratch, Headless UI, React Aria
- **Rationale**: Battle-tested accessibility, unstyled, great DX
- **Decision**: Use for complex components (Modal, Select)

---

## Appendix B: Component Checklist

**Before shipping a component**:

- [ ] TypeScript interface defined
- [ ] JSDoc comments on all props
- [ ] Storybook stories created
- [ ] Unit tests ≥ 80% coverage
- [ ] Accessibility tests pass (vitest-axe)
- [ ] Manual keyboard testing done
- [ ] Screen reader tested
- [ ] Dark mode verified
- [ ] Responsive on mobile/tablet/desktop
- [ ] README documentation updated
- [ ] CHANGELOG entry added
- [ ] Peer review approved
- [ ] CI pipeline green

---

**Document Version**: 1.0.0  
**Last Review**: 2025-11-16  
**Next Review**: 2026-02-16 (quarterly)
