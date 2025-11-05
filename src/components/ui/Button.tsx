import { Slot } from '@radix-ui/react-slot'
import clsx from 'clsx'
import React from 'react'

export type ButtonProps = React.ComponentProps<'button'> & {
  asChild?: boolean
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
}

const variantMap = {
  solid:
    'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700',
  outline:
    'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-950',
  ghost:
    'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      variant = 'solid',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...rest
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || isLoading

    // Only add role="button" when using asChild with non-button elements
    const buttonProps = {
      ref: ref as React.Ref<HTMLButtonElement>,
      ...(asChild ? {} : { type: 'button' as const }),
      'aria-busy': isLoading || undefined,
      'aria-disabled': isDisabled || undefined,
      disabled: isDisabled,
      className: clsx(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'transition-colors duration-200',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        sizeMap[size],
        variantMap[variant],
        className
      ),
      ...rest,
    }

    return (
      <Comp {...buttonProps}>
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'
