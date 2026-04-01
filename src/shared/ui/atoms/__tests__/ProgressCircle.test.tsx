import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressCircle } from '../ProgressCircle';

describe('ProgressCircle', () => {
  it('renders with progressbar role', () => {
    render(<ProgressCircle value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays correct aria-valuenow', () => {
    render(<ProgressCircle value={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '75'
    );
  });

  it('renders SVG element', () => {
    const { container } = render(<ProgressCircle value={50} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows percentage text', () => {
    render(<ProgressCircle value={60} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(<ProgressCircle value={50} size={128} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '128');
    expect(svg).toHaveAttribute('height', '128');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProgressCircle value={50} className="custom" />
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});
