import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '../Input';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders as input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  describe('value and onChange', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');

      await user.type(input, 'Hello');
      expect(input).toHaveValue('Hello');
    });

    it('calls onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('works as controlled component', async () => {
      const handleChange = vi.fn();
      render(<Input value="controlled" onChange={handleChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });
  });

  describe('prefix and suffix', () => {
    it('renders prefix element', () => {
      render(<Input prefix={<span data-testid="prefix">$</span>} />);
      expect(screen.getByTestId('prefix')).toBeInTheDocument();
    });

    it('renders suffix element', () => {
      render(<Input suffix={<span data-testid="suffix">@example.com</span>} />);
      expect(screen.getByTestId('suffix')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('applies error styles when error prop is true', () => {
      const { container } = render(<Input error />);
      expect(container.querySelector('input')).toHaveClass('border-danger');
    });

    it('has aria-invalid when error', () => {
      render(<Input error />);
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('input types', () => {
    it('renders email type input', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders password type input', () => {
      render(<Input type="password" />);
      expect(
        document.querySelector('input[type="password"]')
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('applies custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('supports placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      expect(
        screen.getByPlaceholderText('Enter your name')
      ).toBeInTheDocument();
    });
  });
});
