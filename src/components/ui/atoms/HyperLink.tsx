import React from 'react';

import { VisuallyHidden } from '@/components/ui/primitives/VisuallyHidden';
import { cn } from '@/lib/cn';

export type HyperLinkUnderline = 'auto' | 'hover' | 'always' | false;

export interface HyperLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  underline?: HyperLinkUnderline;
}

const underlineStyles: Record<string, string> = {
  auto: 'underline',
  hover: 'no-underline hover:underline',
  always: 'underline',
  false: 'no-underline',
};

/**
 * HyperLink component
 *
 * Accessible link component with external link support.
 *
 * **A11y**: External links add rel="noopener noreferrer" and visually hidden text.
 *
 * @example
 * ```tsx
 * <HyperLink href="/about">About</HyperLink>
 * <HyperLink href="https://example.com" external>External</HyperLink>
 * <HyperLink href="/docs" underline="hover">Docs</HyperLink>
 * ```
 */
export const HyperLink = React.forwardRef<HTMLAnchorElement, HyperLinkProps>(
  (
    {
      className,
      href,
      children,
      external = false,
      underline = 'auto',
      ...props
    },
    ref
  ) => {
    const externalProps = external
      ? {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : {};

    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'text-primary hover:text-primary-600',
          'transition-colors duration-200',
          'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          underlineStyles[String(underline)],
          className
        )}
        {...externalProps}
        {...props}
      >
        {children}
        {external && (
          <>
            <svg
              className="ml-1 inline-block h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <VisuallyHidden>(opens in new tab)</VisuallyHidden>
          </>
        )}
      </a>
    );
  }
);

HyperLink.displayName = 'HyperLink';
