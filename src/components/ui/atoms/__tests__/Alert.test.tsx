import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from '../Alert';

describe('Alert', () => {
  it('renders children content', () => {
    render(<Alert>Alert message</Alert>);
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('has role alert', () => {
    render(<Alert>Test</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  describe('title', () => {
    it('renders title when provided', () => {
      render(<Alert title="Warning">Message</Alert>);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });
  });

  describe('tones', () => {
    it('applies info tone styles', () => {
      const { container } = render(<Alert tone="info">Info</Alert>);
      expect(container.firstChild).toHaveClass('bg-info/10', 'border-info/20');
    });

    it('applies success tone styles', () => {
      const { container } = render(<Alert tone="success">Success</Alert>);
      expect(container.firstChild).toHaveClass('bg-success/10');
    });

    it('applies warn tone styles', () => {
      const { container } = render(<Alert tone="warn">Warning</Alert>);
      expect(container.firstChild).toHaveClass('bg-warn/10');
    });

    it('applies danger tone styles', () => {
      const { container } = render(<Alert tone="danger">Error</Alert>);
      expect(container.firstChild).toHaveClass('bg-danger/10');
    });
  });

  describe('icon', () => {
    it('shows icon by default', () => {
      const { container } = render(<Alert>With icon</Alert>);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      const { container } = render(<Alert showIcon={false}>No icon</Alert>);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders custom icon', () => {
      render(
        <Alert icon={<span data-testid="custom-icon">★</span>}>Custom</Alert>
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('dismissible', () => {
    it('shows dismiss button when dismissible', () => {
      render(
        <Alert dismissible onDismiss={vi.fn()}>
          Dismissible
        </Alert>
      );
      expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button clicked', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();
      render(
        <Alert dismissible onDismiss={handleDismiss}>
          Test
        </Alert>
      );

      await user.click(screen.getByLabelText('Dismiss alert'));
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
