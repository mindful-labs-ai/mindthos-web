import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../Button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as button element by default', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  describe('sizes', () => {
    it('applies small size styles', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      expect(container.firstChild).toHaveClass('h-8', 'px-3', 'text-sm');
    });

    it('applies medium size styles', () => {
      const { container } = render(<Button size="md">Medium</Button>);
      expect(container.firstChild).toHaveClass('h-10', 'px-4', 'text-sm');
    });

    it('applies large size styles', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      expect(container.firstChild).toHaveClass('h-12', 'px-5', 'text-base');
    });
  });

  describe('tones and variants', () => {
    it('applies primary solid styles', () => {
      const { container } = render(
        <Button tone="primary" variant="solid">
          Primary
        </Button>
      );
      expect(container.firstChild).toHaveClass('bg-primary', 'text-surface');
    });

    it('applies outline variant styles', () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      expect(container.firstChild).toHaveClass('border-2');
    });

    it('applies ghost variant styles', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      expect(container.firstChild).toHaveClass('bg-transparent');
    });
  });

  describe('interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toContainHTML('svg');
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('icons', () => {
    it('renders icon before text', () => {
      render(
        <Button icon={<span data-testid="icon">★</span>}>With Icon</Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders iconRight after text', () => {
      render(
        <Button iconRight={<span data-testid="icon-right">→</span>}>
          With Icon
        </Button>
      );
      expect(screen.getByTestId('icon-right')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Button className="custom-class">Custom</Button>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
