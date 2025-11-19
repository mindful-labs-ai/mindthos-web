# Testing Strategy Specification

**Project**: Mindthos Web  
**Version**: 1.0.0  
**Last Updated**: 2025-11-16  
**Status**: Active

---

## 1. Testing Philosophy

### 1.1 Test Pyramid

```
         /\
        /E2E\         10% - Critical user flows
       /------\
      /  Integ \      20% - Component interactions
     /----------\
    /    Unit    \    70% - Individual components
   /--------------\
```

**Rationale**: Unit tests provide fast feedback and high coverage, while E2E
tests validate real user scenarios.

### 1.2 Testing Principles

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Write tests before code** (TDD) - Ensures testability and clear
   requirements
3. **Maintain high coverage** - 80%+ for confidence in changes
4. **Test accessibility** - Every component must be keyboard navigable and
   screen reader compatible
5. **Keep tests fast** - Unit tests < 5 minutes, E2E < 10 minutes

---

## 2. Unit Testing

### 2.1 Framework: Vitest

**Why Vitest?**

- Native Vite integration (uses same config)
- Fast execution (ESBuild + parallelization)
- Jest-compatible API (easy migration)
- Built-in coverage (c8/v8)
- TypeScript first-class support

**Configuration** (`vitest.config.ts`):

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.stories.tsx',
        '**/*.spec.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
```

### 2.2 React Testing Library

**Why RTL?**

- Encourages testing user behavior
- Discourages implementation details
- Excellent accessibility utilities
- Active community and documentation

**Setup** (`src/test/setup.ts`):

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 2.3 Test Structure

**Mandatory structure for all components**:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ComponentName } from './ComponentName';

expect.extend(toHaveNoViolations);

describe('ComponentName', () => {
  // 1. RENDERING TESTS
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ComponentName>Content</ComponentName>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <ComponentName className="custom">Content</ComponentName>
      );
      expect(container.firstChild).toHaveClass('custom');
    });
  });

  // 2. PROPS TESTS
  describe('Props', () => {
    it.each(['sm', 'md', 'lg'])('renders %s size correctly', (size) => {
      render(<ComponentName size={size}>Content</ComponentName>);
      expect(screen.getByText('Content')).toHaveClass(`size-${size}`);
    });

    it('applies variant styles', () => {
      const { rerender } = render(<ComponentName variant="solid" />);
      expect(screen.getByRole('button')).toHaveClass('variant-solid');

      rerender(<ComponentName variant="outline" />);
      expect(screen.getByRole('button')).toHaveClass('variant-outline');
    });
  });

  // 3. INTERACTION TESTS
  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ComponentName onClick={handleClick}>Click me</ComponentName>);
      await user.click(screen.getByText('Click me'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', async () => {
      const handleKeyDown = vi.fn();
      const user = userEvent.setup();

      render(<ComponentName onKeyDown={handleKeyDown} />);
      const element = screen.getByRole('button');
      await user.type(element, '{Enter}');

      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  // 4. STATE TESTS
  describe('States', () => {
    it('shows disabled state', () => {
      render(<ComponentName disabled>Content</ComponentName>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state', () => {
      render(<ComponentName isLoading>Content</ComponentName>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(<ComponentName error="Error message">Content</ComponentName>);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  // 5. REF FORWARDING
  describe('Ref Forwarding', () => {
    it('forwards ref to underlying element', () => {
      const ref = vi.fn();
      render(<ComponentName ref={ref}>Content</ComponentName>);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    });
  });

  // 6. ACCESSIBILITY
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ComponentName>Content</ComponentName>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes', () => {
      render(<ComponentName aria-label="Description">Content</ComponentName>);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ComponentName>Content</ComponentName>);

      const element = screen.getByRole('button');
      await user.tab();
      expect(element).toHaveFocus();
    });
  });
});
```

### 2.4 Coverage Requirements

**Minimum thresholds** (enforced by CI):

```json
{
  "lines": 80,
  "functions": 80,
  "statements": 80,
  "branches": 70
}
```

**Exclusions**:

- Storybook stories (`*.stories.tsx`)
- Test files themselves (`*.test.tsx`, `*.spec.ts`)
- Configuration files
- Type definitions only

**How to check**:

```bash
pnpm test:ci
```

**View HTML report**:

```bash
open coverage/index.html
```

---

## 3. Integration Testing

### 3.1 Component Composition Tests

**Purpose**: Test how components work together

**Example**: FormField + Input + Button

```typescript
describe('Contact Form Integration', () => {
  it('validates and submits form', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <form onSubmit={handleSubmit}>
        <FormField label="Email" error={emailError}>
          <Input type="email" value={email} onChange={setEmail} />
        </FormField>
        <Button type="submit">Submit</Button>
      </form>
    );

    // Fill form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');

    // Submit
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalled();
  });
});
```

### 3.2 Context Provider Tests

**Example**: Toast notifications

```typescript
describe('Toast Integration', () => {
  it('shows toast notification', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Trigger toast
    await user.click(screen.getByText('Show Toast'));

    // Verify toast appears
    expect(screen.getByRole('status')).toHaveTextContent('Success');

    // Auto-dismisses after duration
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 5500 });
  });
});
```

---

## 4. E2E Testing

### 4.1 Framework: Playwright

**Why Playwright?**

- Cross-browser testing (Chromium, Firefox, WebKit)
- Auto-wait (no flaky tests)
- Network interception
- Screenshots/videos
- Parallel execution

**Configuration** (`playwright.config.ts`):

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 Test Structure

**Example**: User registration flow

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('completes registration successfully', async ({ page }) => {
    // Fill form
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');

    // Accept terms
    await page.check('[name="terms"]');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.toast')).toContainText('Welcome, John!');
  });

  test('shows validation errors', async ({ page }) => {
    // Submit without filling
    await page.click('button[type="submit"]');

    // Verify errors
    await expect(page.locator('[role="alert"]')).toContainText(
      'Name is required'
    );
    await expect(page.locator('[role="alert"]')).toContainText(
      'Email is required'
    );
  });

  test('prevents duplicate emails', async ({ page }) => {
    // Fill with existing email
    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('.toast')).toContainText('Email already in use');
  });
});
```

### 4.3 Critical Paths

**Must have E2E coverage**:

1. User authentication (login, logout, register)
2. Form submissions (contact, checkout, profile update)
3. Navigation flows (multi-step processes)
4. Payment flows (if applicable)
5. Search and filtering
6. File uploads
7. Real-time updates (WebSocket, SSE)

### 4.4 Best Practices

**DO**:

- ✅ Use data-testid for stable selectors
- ✅ Test user flows, not individual components
- ✅ Use Page Object Model for reusability
- ✅ Run in CI on every PR
- ✅ Take screenshots on failure

**DON'T**:

- ❌ Test implementation details
- ❌ Use brittle CSS selectors
- ❌ Create interdependent tests
- ❌ Skip error scenarios
- ❌ Test everything (focus on critical paths)

---

## 5. Visual Regression Testing

### 5.1 Storybook + Chromatic

**Purpose**: Catch unintended visual changes

**Setup**:

```bash
pnpm add -D chromatic
```

**Configuration** (`.github/workflows/chromatic.yml`):

```yaml
name: Chromatic
on: push
jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm chromatic --project-token=${{ secrets.CHROMATIC_TOKEN }}
```

**Storybook snapshot tests**:

```typescript
// Button.stories.tsx
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      {(['solid', 'outline', 'ghost', 'soft'] as const).map(variant => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
  parameters: {
    chromatic: { viewports: [375, 768, 1280] },
  },
};
```

### 5.2 Manual Review Process

**Before PR approval**:

1. Open Storybook (`pnpm storybook`)
2. Review all stories for component
3. Toggle dark mode
4. Test responsive breakpoints
5. Verify accessibility panel (no violations)

---

## 6. Accessibility Testing

### 6.1 Automated: vitest-axe

**Integration with unit tests**:

```typescript
import { axe, toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

it('has no a11y violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**What it catches**:

- Missing alt text
- Low color contrast
- Missing ARIA labels
- Invalid HTML structure
- Missing form labels

**What it misses**:

- Keyboard navigation
- Focus management
- Screen reader experience
- Logical tab order

### 6.2 Manual: Keyboard Testing

**Checklist**:

- [ ] Tab/Shift+Tab moves focus logically
- [ ] Enter/Space activates buttons/links
- [ ] Arrow keys navigate lists/menus
- [ ] Escape closes modals/dropdowns
- [ ] Home/End jump to first/last
- [ ] Focus indicators visible
- [ ] No keyboard traps

### 6.3 Screen Reader Testing

**Tools**:

- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (macOS/iOS, built-in)

**Test scenarios**:

1. Navigate by headings (H key)
2. Navigate by landmarks (D key)
3. Navigate forms (F key, Tab)
4. Read all content (Down arrow)
5. Activate buttons (Enter)
6. Verify ARIA announcements

---

## 7. Performance Testing

### 7.1 Lighthouse CI

**Configuration** (`.lighthouserc.json`):

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:5173/"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }]
      }
    }
  }
}
```

**Run**:

```bash
pnpm lhci autorun
```

### 7.2 Bundle Size

**Tools**: Vite bundle analyzer

```bash
pnpm build
pnpm analyze-bundle
```

**Thresholds**:

- Total JS: < 200KB gzipped
- Individual chunk: < 50KB gzipped
- CSS: < 20KB gzipped

**Monitor**:

```json
// package.json
{
  "scripts": {
    "size-check": "size-limit"
  },
  "size-limit": [
    {
      "path": "dist/assets/*.js",
      "limit": "200 KB"
    }
  ]
}
```

### 7.3 Render Performance

**React DevTools Profiler**:

1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with app
5. Stop recording
6. Review flamegraph

**Metrics**:

- Initial render: < 100ms
- Re-render: < 16ms (60fps)
- Largest component: < 50ms

---

## 8. Test Data Management

### 8.1 Factories

**Pattern**: Use factories for test data

```typescript
// src/test/factories/user.ts
import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.past(),
  ...overrides,
});

// Usage in tests
const user = createUser({ name: 'John Doe' });
```

### 8.2 Fixtures

**Pattern**: Reusable test scenarios

```typescript
// tests/fixtures/authenticated-user.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedUser: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await use(page);

    // Cleanup
    await page.click('[aria-label="Logout"]');
  },
});

// Usage
test('user can view profile', async ({ authenticatedUser }) => {
  await authenticatedUser.goto('/profile');
  // Test logic...
});
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Build
        run: pnpm build

      - name: E2E tests
        run: pnpm e2e:ci

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### 9.2 Pre-commit Hooks (Husky)

```bash
# .husky/pre-commit
#!/bin/sh
pnpm typecheck
pnpm lint
pnpm test --run --passWithNoTests
```

### 9.3 Pre-push Hooks

```bash
# .husky/pre-push
#!/bin/sh
pnpm pre-push
```

---

## 10. Test Maintenance

### 10.1 Flaky Test Policy

**Definition**: Test that passes/fails randomly

**When detected**:

1. Mark as `.skip()` temporarily
2. Create GitHub issue
3. Debug and fix within 1 sprint
4. If unfixable, remove test

**Common causes**:

- Race conditions (missing `waitFor`)
- Timing dependencies
- Shared state between tests
- Network instability

### 10.2 Test Refactoring

**Triggers**:

- Test takes > 5 seconds
- Repeated setup code (extract to helper)
- Brittle selectors (use semantic queries)
- Implementation details leaked

**Best practices**:

- Keep tests DRY (Don't Repeat Yourself)
- Use descriptive test names
- One assertion per test (when logical)
- Arrange-Act-Assert pattern

---

**Document Version**: 1.0.0  
**Last Review**: 2025-11-16  
**Next Review**: 2026-02-16
