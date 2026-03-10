import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has aria-busy attribute', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  describe('variants', () => {
    it('applies text variant styles', () => {
      const { container } = render(<Skeleton variant="text" />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.borderRadius).toBe('var(--radius-sm)');
    });

    it('applies circle variant with 50% border radius', () => {
      const { container } = render(<Skeleton variant="circle" width={40} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.borderRadius).toBe('50%');
    });

    it('applies rectangle variant styles', () => {
      const { container } = render(<Skeleton variant="rectangle" />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.borderRadius).toBe('var(--radius-md)');
    });
  });

  describe('dimensions', () => {
    it('applies custom width', () => {
      const { container } = render(<Skeleton width={200} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe('200px');
    });

    it('applies custom height', () => {
      const { container } = render(<Skeleton height={100} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('100px');
    });
  });

  it('has pulse animation', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
