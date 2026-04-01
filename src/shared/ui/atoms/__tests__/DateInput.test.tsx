import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateInput } from '../DateInput';

describe('DateInput', () => {
  it('renders as date input', () => {
    render(<DateInput />);
    const input = document.querySelector('input[type="date"]');
    expect(input).toBeInTheDocument();
  });

  it('accepts date value', async () => {
    const user = userEvent.setup();
    render(<DateInput />);
    const input = document.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;

    await user.type(input, '2024-01-15');
    expect(input.value).toBe('2024-01-15');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<DateInput onChange={handleChange} />);
    const input = document.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;

    await user.type(input, '2024-01-15');
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies min attribute', () => {
    render(<DateInput min="2024-01-01" />);
    const input = document.querySelector('input[type="date"]');
    expect(input).toHaveAttribute('min', '2024-01-01');
  });

  it('applies max attribute', () => {
    render(<DateInput max="2024-12-31" />);
    const input = document.querySelector('input[type="date"]');
    expect(input).toHaveAttribute('max', '2024-12-31');
  });

  it('is disabled when disabled prop is true', () => {
    render(<DateInput disabled />);
    expect(document.querySelector('input[type="date"]')).toBeDisabled();
  });
});
