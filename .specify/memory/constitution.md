# Mindthos Web Constitution

## Core Principles

### I. Code Quality Standards (NON-NEGOTIABLE)

**All code must meet strict quality requirements before merging:**

- TypeScript strict mode enforced - no `any` types without explicit
  justification
- Zero ESLint warnings/errors - `pnpm lint` must pass clean
- Prettier formatting enforced - 2-space indentation, organized imports,
  Tailwind class ordering
- Import organization: `react` → external packages → `@/**` aliases → relative
  (parent → sibling → index)
- Naming conventions strictly followed:
  - Components: PascalCase (`Button`, `FormField`)
  - Hooks/stores: camelCase with prefix (`useThemeStore`, `authService`)
  - Directories: kebab-case (`ui/atoms`, `test-results`)
  - Files: match component names (`Button.tsx`, `Button.test.tsx`,
    `Button.stories.tsx`)

### II. Test-First Development (NON-NEGOTIABLE)

**TDD cycle mandatory for all features:**

- **Unit Tests**: 80% minimum coverage (lines/functions/statements), 70%
  branches
- **Test structure required**:
  1. Basic rendering (no crash, content visible)
  2. All props validation (variants, sizes, states)
  3. User interactions (`@testing-library/user-event`)
  4. Ref forwarding (for components using `React.forwardRef`)
  5. Accessibility (`vitest-axe` for zero violations)
- **E2E Tests**: Critical user flows with Playwright (`tests/e2e/*.spec.ts`)
- **Test co-location**: Place `*.test.tsx` next to source files or in
  `__tests__/` subdirectory
- **Red-Green-Refactor**: Tests fail first → implement → tests pass → refactor

### III. Component Architecture

**All UI components must follow the established pattern:**

- **Structure**:
  - `ComponentName.tsx` - Implementation with TypeScript interfaces
  - `ComponentName.test.tsx` - Comprehensive test suite
  - `ComponentName.stories.tsx` - Storybook documentation
  - Export via `index.ts`
- **Requirements**:
  - Use `React.forwardRef` for ref forwarding
  - Set `displayName` for debugging
  - JSDoc comments for all props
  - CSS tokens only - NO hardcoded colors (`bg-primary-500` ✅ | `bg-blue-500`
    ❌)
  - `clsx` for conditional className composition
  - Explicit TypeScript Props interface
- **Storybook mandatory**:
  - Default story + all variants
  - Real-world usage examples
  - argTypes with controls
  - `autodocs` tag enabled

### IV. Design System Consistency

**Visual and interaction patterns must be uniform:**

- **Design tokens**: All colors, spacing, typography via `src/styles/tokens.css`
- **Tailwind configuration**: Theme extends from `tailwind.config.ts`
- **Dark mode**: Class-based (`dark:` prefix), no inline styles
- **Accessibility**:
  - Semantic HTML elements required
  - ARIA attributes where needed (role, aria-\*, aria-live)
  - Keyboard navigation support (Arrow keys, Enter, Space, Escape, Tab)
  - Screen reader compatibility verified
- **Component hierarchy**:
  - `primitives/` - Radix UI wrappers, basic building blocks
  - `atoms/` - Standalone, single-responsibility components
  - `composites/` - Multi-part components combining atoms

### V. Performance & Build Standards

**Production builds must be optimized:**

- Vite + SWC compilation for fast builds
- Code splitting at route level
- Lazy loading for non-critical components
- Bundle size monitoring - flag increases >10%
- Lighthouse scores: Performance ≥90, Accessibility 100, Best Practices ≥90
- `pnpm build` must succeed without warnings

## Testing Protocols

### Unit Testing Requirements

- **Framework**: Vitest v4+ with React Testing Library v16+
- **Setup**: Shared configuration in `src/test/setup.ts`
- **Coverage gates**: CI fails if coverage drops below thresholds
- **Accessibility**: `vitest-axe` integration mandatory for UI components
- **Mocking**: Use `vi.fn()` for callbacks, avoid implementation details

### E2E Testing Requirements

- **Framework**: Playwright with TypeScript
- **Location**: `tests/e2e/*.spec.ts`
- **Scope**: Critical paths (auth, checkout, core workflows)
- **Execution**: `pnpm e2e` locally, `pnpm e2e:ci` in CI pipeline
- **Coverage**: All user-facing features require at least one E2E scenario

### Storybook Testing

- **Interactive tests**: Use `@storybook/addon-interactions`
- **Accessibility audit**: `@storybook/addon-a11y` enabled
- **Visual review**: Manual review of all stories before PR approval
- **Command**: `pnpm storybook:test` for automated checks

## Development Workflow

### Pre-Commit Requirements

1. `pnpm typecheck` - TypeScript compilation succeeds
2. `pnpm lint` - ESLint passes (use `lint:fix` for auto-fixes)
3. `pnpm format` - Prettier formatting applied
4. `pnpm test` - Unit tests pass in watch mode

### Pre-Push Requirements (CI Gate)

**Execute `pnpm pre-push` or `pnpm test:all` before pushing:**

1. Format code (`pnpm format`)
2. Fix lint issues (`pnpm lint:fix`)
3. Type checking (`pnpm typecheck`)
4. Unit tests with coverage (`pnpm test:ci`)
5. Production build (`pnpm build`)
6. E2E tests (`pnpm e2e:ci`)

### Pull Request Requirements

- **Title**: Conventional Commits format (`feat:`, `fix:`, `refact:`, `test:`,
  `docs:`)
- **Description**: Clear summary of changes, linked issues, breaking changes
- **Evidence**:
  - Test results screenshot/logs
  - UI changes: Before/After screenshots or GIF
  - Coverage report if adding new features
- **Reviews**: At least one approval required
- **CI status**: All checks must pass (GitHub Actions workflow)

### Branching Strategy

- `main` - Production-ready code
- `feature/*` - New features (e.g., `feature/ai-agent`)
- `fix/*` - Bug fixes
- `refact/*` - Code refactoring
- Merge via Pull Request only, no direct commits to `main`

## Security & Environment Standards

### Environment Variable Management

- **Validation**: All env vars validated via Zod schema in `src/lib/env.ts`
- **Template**: `.env.example` contains all required keys with example values
- **Secrets**: NEVER commit `.env.local` or any file with real credentials
- **Naming**: Vite variables prefixed with `VITE_` (e.g., `VITE_APP_NAME`)
- **Documentation**: New env vars documented in `README.md` and relevant ADR

### Dependency Management

- **Package manager**: pnpm only (disk efficient, faster installs)
- **Lockfile**: `pnpm-lock.yaml` committed, always up-to-date
- **Updates**: Review changelogs before upgrading major versions
- **Security**: Run `pnpm audit` regularly, fix high/critical vulnerabilities
  immediately

### Code Security

- **No credentials in code**: Use environment variables exclusively
- **XSS prevention**: React's JSX escaping by default, validate external HTML
- **CSRF protection**: Implement tokens for state-changing operations
- **Dependencies**: Avoid unmaintained packages, prefer well-audited libraries

## Documentation Requirements

### Code Documentation

- **TypeScript**: Types serve as inline documentation
- **JSDoc**: Required for public APIs, complex logic, non-obvious behavior
- **Comments**: Explain "why" not "what" - code should be self-explanatory

### Project Documentation

- **README.md**: Quick start, scripts, project structure, troubleshooting
- **AGENTS.md**: AI agent guidance for project conventions
- **docs/**: Detailed guides (DEVELOPMENT_GUIDE.md, COMPONENTS_TESTS.md,
  COMPOSITES_USAGE.md)
- **ADRs**: Architecture Decision Records in `docs/` for significant choices
- **Storybook**: Living component documentation with interactive examples

## Governance

### Constitution Authority

- This constitution supersedes all other practices
- When conflicts arise, constitution takes precedence
- Amendments require:
  1. Written proposal with rationale
  2. Team discussion and approval
  3. Version bump and "Last Amended" date update
  4. Migration plan if breaking existing code

### Compliance Verification

- **All PRs** must demonstrate compliance with these principles
- **CI pipeline** enforces quality gates automatically
- **Code reviews** verify adherence to patterns and standards
- **Complexity** must be justified - prefer simple solutions (YAGNI principle)

### Review Process

- Reviewers check for:
  - Test coverage and quality
  - Accessibility compliance
  - Design system consistency
  - Performance implications
  - Security considerations
- Block merge if critical principles violated
- Suggest improvements for non-critical issues

### Living Document

- Constitution evolves with project needs
- Continuous improvement encouraged
- Feedback loop: Team retrospectives → Constitution updates → Better code

**Version**: 1.0.0 | **Ratified**: 2025-11-16 | **Last Amended**: 2025-11-16
