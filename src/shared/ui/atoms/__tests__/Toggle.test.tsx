import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders as switch', () => {
    render(<Toggle />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('toggles on click', async () => {
    const user = userEvent.setup();
    render(<Toggle />);
    const toggle = screen.getByRole('switch');

    await user.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('calls onChange with checked state', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle onChange={handleChange} />);

    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalled();
  });

  it('respects controlled value', () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Toggle disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
