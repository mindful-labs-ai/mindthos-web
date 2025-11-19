# Design System Specification

**Project**: Mindthos Web  
**Version**: 1.0.0  
**Last Updated**: 2025-11-16  
**Status**: Active

---

## 1. Design Tokens

### 1.1 Color System

#### 1.1.1 Semantic Colors

**Purpose**: Provide consistent color naming across light/dark modes

```css
:root {
  /* Base */
  --color-bg: hsl(0, 0%, 100%); /* Background */
  --color-fg: hsl(222, 47%, 11%); /* Foreground (text) */
  --color-border: hsl(214, 32%, 91%); /* Border */
  --color-muted: hsl(210, 40%, 96%); /* Muted backgrounds */

  /* Brand */
  --color-primary-50: hsl(222, 47%, 98%);
  --color-primary-100: hsl(222, 47%, 95%);
  --color-primary-200: hsl(222, 47%, 90%);
  --color-primary-300: hsl(222, 47%, 80%);
  --color-primary-400: hsl(222, 47%, 65%);
  --color-primary-500: hsl(222, 47%, 50%); /* Base */
  --color-primary-600: hsl(222, 47%, 40%);
  --color-primary-700: hsl(222, 47%, 30%);
  --color-primary-800: hsl(222, 47%, 20%);
  --color-primary-900: hsl(222, 47%, 10%);

  /* Feedback */
  --color-success: hsl(142, 76%, 36%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 84%, 60%);
  --color-info: hsl(199, 89%, 48%);
}

.dark {
  --color-bg: hsl(222, 47%, 11%);
  --color-fg: hsl(0, 0%, 100%);
  --color-border: hsl(217, 33%, 17%);
  --color-muted: hsl(223, 47%, 15%);
  /* ... inverted scales */
}
```

#### 1.1.2 Color Tones

**Available tones**: primary, secondary, accent, neutral

**Usage rules**:

- Primary: Main brand actions (CTAs, primary buttons)
- Secondary: Supporting actions
- Accent: Highlights, special features
- Neutral: Low-emphasis actions

**Accessibility requirement**: All text/background combinations MUST meet WCAG
AA (4.5:1 contrast ratio)

---

### 1.2 Typography

#### 1.2.1 Font Families

```css
:root {
  --font-family-base:
    'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'Roboto', 'Helvetica Neue', sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Loading strategy**: Self-hosted fonts with font-display: swap

#### 1.2.2 Font Scales

```css
:root {
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
}
```

**Usage guidelines**:

- Body text: `base` (16px)
- Small text: `sm` (14px)
- Captions: `xs` (12px)
- H1: `4xl`
- H2: `3xl`
- H3: `2xl`
- H4: `xl`

#### 1.2.3 Font Weights

```css
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

#### 1.2.4 Line Heights

```css
:root {
  --line-height-tight: 1.25; /* Headings */
  --line-height-normal: 1.5; /* Body text */
  --line-height-relaxed: 1.75; /* Long-form content */
}
```

---

### 1.3 Spacing

**Strategy**: Follow Tailwind's 4px base unit

```css
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-5: 1.25rem; /* 20px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-10: 2.5rem; /* 40px */
  --spacing-12: 3rem; /* 48px */
  --spacing-16: 4rem; /* 64px */
  --spacing-20: 5rem; /* 80px */
  --spacing-24: 6rem; /* 96px */
}
```

**Component spacing rules**:

- Button padding: `px-4 py-2` (medium)
- Input padding: `px-4 py-2` (medium)
- Card padding: `p-6` (24px)
- Modal padding: `p-6` (24px)
- Section margins: `my-12` (48px)

---

### 1.4 Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem; /* 4px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem; /* 8px */
  --radius-xl: 0.75rem; /* 12px */
  --radius-2xl: 1rem; /* 16px */
  --radius-full: 9999px; /* Circle/pill */
}
```

**Usage**:

- Buttons: `lg` (8px)
- Inputs: `lg` (8px)
- Cards: `xl` (12px)
- Modals: `xl` (12px)
- Badges/Pills: `full`

---

### 1.5 Shadows

```css
:root {
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md:
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg:
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl:
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
```

**Dark mode adjustments**: Shadows should be subtler in dark mode (reduce alpha)

**Usage**:

- Buttons (hover): `sm`
- Cards: `md`
- Modals: `xl`
- Dropdowns: `lg`
- Tooltips: `md`

---

### 1.6 Transitions

```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Easing curves */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Animation principles**:

- Micro-interactions: 150ms (hover, focus)
- Component transitions: 200ms (tab switch, accordion)
- Modal/page transitions: 300ms (enter/exit)
- Never exceed 400ms (feels sluggish)

---

## 2. Component Patterns

### 2.1 Size Scale

**Consistent sizes across components**:

```typescript
type Size = 'sm' | 'md' | 'lg';

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm', // Small
  md: 'px-4 py-2 text-base', // Medium (default)
  lg: 'px-5 py-2.5 text-lg', // Large
};
```

**When to use**:

- `sm`: Compact UIs, secondary actions
- `md`: Default, most common
- `lg`: Emphasis, primary CTAs

### 2.2 Tone System

**Color tone application**:

```typescript
type Tone = 'primary' | 'secondary' | 'accent' | 'neutral';

const toneColors = {
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  accent: 'bg-accent-500 text-white',
  neutral: 'bg-neutral-500 text-white',
};
```

**Semantic meaning**:

- Primary: Main brand actions
- Secondary: Alternative actions
- Accent: Highlights, promotions
- Neutral: Utility actions (cancel, back)

### 2.3 State Variants

**Visual states for all interactive components**:

```typescript
const stateClasses = {
  default: 'opacity-100',
  hover: 'hover:opacity-90',
  focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  active: 'active:scale-95',
  disabled: 'disabled:opacity-60 disabled:cursor-not-allowed',
};
```

**Requirements**:

- Hover: Subtle feedback (opacity, shadow)
- Focus: Clear keyboard indicator (ring)
- Active: Pressed state (scale, shadow)
- Disabled: Visual cue + no interaction

---

## 3. Iconography

### 3.1 Icon Library

**Choice**: Lucide React (fork of Feather Icons)

**Rationale**:

- Consistent stroke width (2px)
- React-first (tree-shakeable)
- Excellent TypeScript support
- 1000+ icons

**Installation**:

```bash
pnpm add lucide-react
```

**Usage**:

```typescript
import { Search, ChevronDown, X } from 'lucide-react';

<Button leftIcon={<Search />}>Search</Button>
```

### 3.2 Icon Sizes

```typescript
const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};
```

**Pairing with components**:

- Button sm → icon sm (16px)
- Button md → icon md (20px)
- Button lg → icon lg (24px)

### 3.3 Icon Colors

**Inherit from parent text color**:

```typescript
<Icon className="text-current" />
```

**Custom colors** (sparingly):

```typescript
<Icon className="text-primary-500" />
```

---

## 4. Layout Principles

### 4.1 Grid System

**12-column grid** (Tailwind default):

```typescript
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-8">Main</div>
  <div className="col-span-12 md:col-span-4">Sidebar</div>
</div>
```

### 4.2 Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Tablet */
md: 768px   /* Small laptop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

**Usage pattern**:

```typescript
className = 'text-sm md:text-base lg:text-lg';
```

### 4.3 Container Sizes

```typescript
const containerSizes = {
  sm: 'max-w-screen-sm' /* 640px */,
  md: 'max-w-screen-md' /* 768px */,
  lg: 'max-w-screen-lg' /* 1024px */,
  xl: 'max-w-screen-xl' /* 1280px */,
  '2xl': 'max-w-screen-2xl' /* 1536px */,
  full: 'max-w-full',
};
```

---

## 5. Animation Guidelines

### 5.1 Entrance Animations

**Fade in**:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Slide in**:

```css
@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 5.2 Exit Animations

**Fade out**:

```css
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

### 5.3 Loading States

**Skeleton pulse**:

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Spinner rotation**:

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## 6. Dark Mode

### 6.1 Implementation

**Class-based approach**:

```html
<html class="dark">
  <body>
    <!-- Dark mode active -->
  </body>
</html>
```

**Tailwind usage**:

```typescript
className = 'bg-white dark:bg-gray-900 text-black dark:text-white';
```

### 6.2 Color Adjustments

**Principles**:

- Reduce shadow intensity
- Increase border contrast
- Adjust color saturation (slightly muted)
- Maintain WCAG AA contrast

**Example adjustments**:

```css
:root {
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dark {
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
}
```

### 6.3 User Preference

**Detection**:

```typescript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

**Storage**:

```typescript
localStorage.setItem('theme', 'dark');
```

**Application**:

```typescript
document.documentElement.classList.toggle('dark', isDark);
```

---

## 7. Accessibility

### 7.1 Color Contrast

**Requirements**:

- Normal text (16px): 4.5:1 minimum
- Large text (24px): 3:1 minimum
- UI components: 3:1 minimum

**Tools**:

- WebAIM Contrast Checker
- Chrome DevTools (Lighthouse)

### 7.2 Focus Indicators

**Default focus ring**:

```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

**Never remove without replacement**:

```css
/* ❌ Never do this */
:focus {
  outline: none;
}

/* ✅ Provide alternative */
:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-200);
}
```

### 7.3 Motion Preferences

**Respect reduced motion**:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Design Tokens in Code

### 8.1 Tailwind Configuration

**Extend theme with custom tokens**:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'hsl(var(--color-primary-50))',
          500: 'hsl(var(--color-primary-500))',
          // ...
        },
        bg: 'hsl(var(--color-bg))',
        fg: 'hsl(var(--color-fg))',
      },
      fontFamily: {
        sans: ['var(--font-family-base)'],
        mono: ['var(--font-family-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        // ...
      },
    },
  },
};
```

### 8.2 CSS Variables Access

**Direct usage in CSS**:

```css
.button {
  background: var(--color-primary-500);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}
```

**Via Tailwind utilities**:

```typescript
className = 'bg-primary-500 rounded-lg transition-base';
```

---

## 9. Design Tool Integration

### 9.1 Figma Sync

**Token structure**:

- Colors → Figma Styles
- Typography → Text Styles
- Spacing → Auto Layout
- Shadows → Effect Styles

**Export format**: Design Tokens JSON

### 9.2 Storybook

**Visual regression testing**:

```bash
pnpm storybook:test
```

**Generates**:

- Component snapshots
- Interaction states
- Responsive views

---

## 10. Maintenance

### 10.1 Token Updates

**Process**:

1. Update `tokens.css`
2. Verify in Storybook
3. Test light/dark modes
4. Check accessibility
5. Document changes in CHANGELOG

### 10.2 Version Control

**Semantic versioning**:

- MAJOR: Breaking changes (color removals, scale changes)
- MINOR: New tokens (backward compatible)
- PATCH: Bug fixes (contrast adjustments)

---

**Document Version**: 1.0.0  
**Last Review**: 2025-11-16  
**Next Review**: 2026-02-16
