import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HyperLink } from '../HyperLink';

describe('HyperLink', () => {
  it('renders as link element', () => {
    render(<HyperLink href="/test">Link</HyperLink>);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('applies href attribute', () => {
    render(<HyperLink href="/page">Go to page</HyperLink>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/page');
  });

  it('opens external links in new tab', () => {
    render(
      <HyperLink href="https://example.com" external>
        External
      </HyperLink>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows external icon when external', () => {
    const { container } = render(
      <HyperLink href="https://example.com" external>
        Link
      </HyperLink>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies underline variant', () => {
    const { container } = render(
      <HyperLink href="#" underline="always">
        Underlined
      </HyperLink>
    );
    expect(container.firstChild).toHaveClass('underline');
  });

  it('renders children content', () => {
    render(<HyperLink href="#">Click here</HyperLink>);
    expect(screen.getByText('Click here')).toBeInTheDocument();
  });
});
