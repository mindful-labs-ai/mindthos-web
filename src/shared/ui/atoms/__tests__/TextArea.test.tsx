import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TextArea } from '../TextArea';

describe('TextArea', () => {
  it('renders as textarea element', () => {
    render(<TextArea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts text input', async () => {
    const user = userEvent.setup();
    render(<TextArea placeholder="Type here" />);
    const textarea = screen.getByPlaceholderText('Type here');

    await user.type(textarea, 'Multi-line text');
    expect(textarea).toHaveValue('Multi-line text');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TextArea onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies rows attribute', () => {
    render(<TextArea rows={5} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
  });

  it('respects maxLength', () => {
    render(<TextArea maxLength={100} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '100');
  });

  it('is disabled when disabled prop is true', () => {
    render(<TextArea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies error styles', () => {
    const { container } = render(<TextArea error />);
    expect(container.querySelector('textarea')).toHaveClass('border-danger');
  });
});
