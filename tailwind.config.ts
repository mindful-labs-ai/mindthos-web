import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      /* ========================================
       * COLORS — semantic tokens from tokens.css
       * ======================================== */
      colors: {
        /* Background */
        bg: {
          DEFAULT: 'var(--color-bg)',
          subtle: 'var(--color-bg-subtle)',
          whisper: 'var(--color-bg-whisper)',
        },
        /* Foreground (text) */
        fg: {
          DEFAULT: 'var(--color-default)',
          muted: 'var(--color-fg-muted)',
          subtle: 'var(--color-fg-subtle)',
          disabled: 'var(--color-fg-disabled)',
          inverse: 'var(--color-fg-inverse)',
        },
        /* Surface */
        surface: {
          DEFAULT: 'var(--color-surface)',
          contrast: 'var(--color-surface-contrast)',
          strong: 'var(--color-surface-strong)',
        },
        /* Border & Ring */
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
        },
        ring: 'var(--color-ring)',
        /* Primary (green) */
        primary: {
          DEFAULT: 'var(--color-primary)',
          fg: 'var(--color-primary-fg)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          subtle: 'var(--color-primary-subtle)',
          surface: 'var(--color-primary-surface)',
        },
        /* Danger (red): idle → hover → active */
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          active: 'var(--color-danger-active)',
          fg: 'var(--color-danger-fg)',
          subtle: 'var(--color-danger-subtle)',
        },
        /* Neutral (grey): idle → hover → active */
        neutral: {
          DEFAULT: 'var(--color-neutral)',
          hover: 'var(--color-neutral-hover)',
          active: 'var(--color-neutral-active)',
          fg: 'var(--color-neutral-fg)',
        },
        /* Status */
        warn: 'var(--color-warn)',
        info: 'var(--color-info)',
        success: 'var(--color-success)',
        accent: 'var(--color-accent)',
        /* Role-based tokens — 컴포넌트/레이아웃 역할별 */
        app: {
          bg: 'var(--color-app-bg)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          border: 'var(--color-sidebar-border)',
        },
        header: {
          bg: 'var(--color-header-bg)',
          border: 'var(--color-header-border)',
        },
        nav: {
          'active-bg': 'var(--color-nav-active-bg)',
          'active-text': 'var(--color-nav-active-text)',
          'inactive-text': 'var(--color-nav-inactive-text)',
          'hover-bg': 'var(--color-nav-hover-bg)',
          'click-bg': 'var(--color-nav-click-bg)',
        },
        card: {
          bg: 'var(--color-card-bg)',
          border: 'var(--color-card-border)',
        },
        input: {
          bg: 'var(--color-input-bg)',
          border: 'var(--color-input-border)',
          placeholder: 'var(--color-input-placeholder)',
        },
        modal: {
          bg: 'var(--color-modal-bg)',
          border: 'var(--color-modal-border)',
        },
        overlay: {
          bg: 'var(--color-overlay-bg)',
        },
        /* Primitive palettes (직접 참조 필요 시) */
        grey: {
          10: 'var(--color-grey-10)',
          20: 'var(--color-grey-20)',
          30: 'var(--color-grey-30)',
          40: 'var(--color-grey-40)',
          60: 'var(--color-grey-60)',
          70: 'var(--color-grey-70)',
          80: 'var(--color-grey-80)',
          90: 'var(--color-grey-90)',
          100: 'var(--color-grey-100)',
        },
        green: {
          10: 'var(--color-green-10)',
          20: 'var(--color-green-20)',
          40: 'var(--color-green-40)',
          80: 'var(--color-green-80)',
        },
        orange: {
          100: 'var(--color-orange-100)',
        },
        red: {
          20: 'var(--color-red-20)',
          50: 'var(--color-red-50)',
          80: 'var(--color-red-80)',
        },
      },

      /* ========================================
       * TYPOGRAPHY — 기획 폰트 스케일
       *
       * Size:   xs(12) sm(14) m(16) l(20) xl(24) 2xl(28)
       * Weight: sub(400) default(500) emphasize(600) headline(700) extrabold(800)
       * LineHeight: default(150%) chip(120%)
       * ======================================== */
      fontSize: {
        xs: ['0.75rem', { lineHeight: '150%' }] /* 12px */,
        sm: ['0.875rem', { lineHeight: '150%' }] /* 14px */,
        m: ['1rem', { lineHeight: '150%' }] /* 16px */,
        l: ['1.25rem', { lineHeight: '150%' }] /* 20px */,
        xl: ['1.5rem', { lineHeight: '150%' }] /* 24px */,
        '2xl': ['1.75rem', { lineHeight: '150%' }] /* 28px */,
      },
      fontWeight: {
        sub: '400',
        medium: '500',
        emphasize: '600',
        headline: '700',
        extrabold: '800',
      },
      lineHeight: {
        default: '150%',
        chip: '120%',
      },

      /* ========================================
       * Z-INDEX
       * ======================================== */
      zIndex: {
        sidebar: 'var(--z-sidebar)',
        header: 'var(--z-header)',
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
        toast: 'var(--z-toast)',
        spotlight: 'var(--z-spotlight)',
        debug: 'var(--z-debug)',
      },

      /* ========================================
       * SPACING
       * ======================================== */
      spacing: {
        page: 'var(--space-page)',
        card: 'var(--space-card)',
        modal: 'var(--space-modal)',
        section: 'var(--space-section)',
        inline: 'var(--space-inline)',
      },

      height: {
        header: 'var(--height-header)',
      },

      width: {
        sidetab: 'var(--width-sidetab)',
      },

      /* ========================================
       * BORDER RADIUS
       * ======================================== */
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },

      /* ========================================
       * SHADOW — 시맨틱 elevation
       * ======================================== */
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        default: 'var(--shadow-default)',
        elevated: 'var(--shadow-elevated)',
        prominent: 'var(--shadow-prominent)',
      },

      /* ========================================
       * TRANSITION
       * ======================================== */
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },

      /* ========================================
       * KEYFRAMES & ANIMATIONS
       * ======================================== */
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translate(-50%, 100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        slideUpFull: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { left: '-33%' },
          '100%': { left: '100%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'logo-draw': {
          '0%': { 'stroke-dashoffset': '1' },
          '45%': { 'stroke-dashoffset': '0' },
          '55%': { 'stroke-dashoffset': '0' },
          '100%': { 'stroke-dashoffset': '-1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideIn: 'slideIn 0.2s ease-out',
        slideUp: 'slideUp 0.2s ease-out',
        slideUpFull: 'slideUpFull 0.3s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
        'logo-draw': 'logo-draw 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
