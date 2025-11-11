import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with progressbar role', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays correct aria-valuenow', () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '75'
    );
  });

  it('applies correct width based on value', () => {
    const { container } = render(<ProgressBar value={60} />);
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toHaveStyle({ width: '60%' });
  });

  it('renders indeterminate state', () => {
    const { container } = render(<ProgressBar indeterminate value={0} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar?.querySelector('div')).toHaveClass(
      'animate-[shimmer_1.5s_ease-in-out_infinite]'
    );
  });

  it('does not show aria-valuenow when indeterminate', () => {
    render(<ProgressBar indeterminate />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute(
      'aria-valuenow'
    );
  });
});
