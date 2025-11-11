import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Chip } from '../Chip';

describe('Chip', () => {
  it('renders label content', () => {
    render(<Chip label="Tag" />);
    expect(screen.getByText('Tag')).toBeInTheDocument();
  });

  describe('tones', () => {
    it('applies primary tone', () => {
      const { container } = render(<Chip tone="primary" label="Primary" />);
      expect(container.firstChild).toHaveClass('bg-primary/10', 'text-primary');
    });

    it('applies secondary tone', () => {
      const { container } = render(<Chip tone="secondary" label="Secondary" />);
      expect(container.firstChild).toHaveClass('bg-secondary/10');
    });
  });

  describe('close button', () => {
    it('shows close button when onClose provided', () => {
      render(<Chip label="Closable" onClose={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      render(<Chip label="Test" onClose={handleClose} />);

      await user.click(screen.getByRole('button'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('applies custom className', () => {
    const { container } = render(<Chip label="Test" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
