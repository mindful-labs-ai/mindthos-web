import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CheckBox } from '../CheckBox';

describe('CheckBox', () => {
  it('renders without crashing', () => {
    render(<CheckBox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders as checkbox', () => {
    render(<CheckBox label="Test" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  describe('checked state', () => {
    it('toggles on click', async () => {
      const user = userEvent.setup();
      render(<CheckBox label="Toggle me" />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('calls onChange with checked state', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<CheckBox label="Test" onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ checked: true }),
        })
      );
    });
  });

  describe('controlled mode', () => {
    it('respects controlled checked value', () => {
      render(<CheckBox label="Controlled" checked={true} onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('indeterminate state', () => {
    it('sets indeterminate property', () => {
      render(<CheckBox label="Indeterminate" indeterminate />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });
  });

  describe('label click', () => {
    it('toggles checkbox when label is clicked', async () => {
      const user = userEvent.setup();
      render(<CheckBox label="Click label" />);

      await user.click(screen.getByText('Click label'));
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<CheckBox label="Disabled" disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      render(<CheckBox label="Disabled" disabled />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('accessibility', () => {
    it('has aria-checked mixed when indeterminate', () => {
      render(<CheckBox label="Test" indeterminate />);
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-checked',
        'mixed'
      );
    });

    it('applies custom className', () => {
      render(<CheckBox label="Custom" className="custom-checkbox" />);
      expect(screen.getByRole('checkbox').closest('div')).toHaveClass(
        'custom-checkbox'
      );
    });
  });

  describe('description', () => {
    it('renders description text', () => {
      render(
        <CheckBox label="With description" description="Additional info" />
      );
      expect(screen.getByText('Additional info')).toBeInTheDocument();
    });
  });
});
