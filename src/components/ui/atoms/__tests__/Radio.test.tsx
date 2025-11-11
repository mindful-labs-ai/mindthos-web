import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Radio } from '../Radio';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Radio', () => {
  it('renders all options', () => {
    render(<Radio options={options} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders as radiogroup', () => {
    render(<Radio options={options} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  describe('selection', () => {
    it('selects option on click', async () => {
      const user = userEvent.setup();
      render(<Radio options={options} />);

      await user.click(screen.getByText('Option 2'));
      const radio = screen.getByRole('radio', { name: /Option 2/i });
      expect(radio).toBeChecked();
    });

    it('allows only one selection', async () => {
      const user = userEvent.setup();
      render(<Radio options={options} />);

      await user.click(screen.getByText('Option 1'));
      await user.click(screen.getByText('Option 2'));

      expect(
        screen.getByRole('radio', { name: /Option 1/i })
      ).not.toBeChecked();
      expect(screen.getByRole('radio', { name: /Option 2/i })).toBeChecked();
    });

    it('calls onChange with selected value', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Radio options={options} onChange={handleChange} />);

      await user.click(screen.getByText('Option 2'));
      expect(handleChange).toHaveBeenCalledWith('2');
    });
  });

  describe('controlled mode', () => {
    it('respects controlled value', () => {
      render(<Radio options={options} value="2" onChange={vi.fn()} />);
      expect(screen.getByRole('radio', { name: /Option 2/i })).toBeChecked();
    });
  });

  describe('keyboard navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();
      render(<Radio options={options} defaultValue="1" />);

      const firstRadio = screen.getByRole('radio', { name: /Option 1/i });
      firstRadio.focus();

      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('radio', { name: /Option 2/i })).toBeChecked();
    });

    it('selects with Space key', async () => {
      const user = userEvent.setup();
      render(<Radio options={options} />);

      const radio = screen.getByRole('radio', { name: /Option 1/i });
      radio.focus();

      await user.keyboard(' ');
      expect(radio).toBeChecked();
    });
  });

  describe('orientation', () => {
    it('applies vertical layout by default', () => {
      const { container } = render(<Radio options={options} />);
      expect(container.querySelector('[role="radiogroup"]')).toHaveClass(
        'flex-col'
      );
    });

    it('applies horizontal layout', () => {
      const { container } = render(
        <Radio options={options} orientation="horizontal" />
      );
      expect(container.querySelector('[role="radiogroup"]')).toHaveClass(
        'flex-row'
      );
    });
  });

  describe('disabled state', () => {
    it('disables all options when disabled prop is true', () => {
      render(<Radio options={options} disabled />);
      options.forEach((option) => {
        expect(
          screen.getByRole('radio', { name: new RegExp(option.label) })
        ).toBeDisabled();
      });
    });

    it('disables individual option', () => {
      const optionsWithDisabled = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2', disabled: true },
      ];
      render(<Radio options={optionsWithDisabled} />);
      expect(screen.getByRole('radio', { name: /Option 2/i })).toBeDisabled();
    });
  });

  describe('descriptions', () => {
    it('renders option descriptions', () => {
      const optionsWithDesc = [
        { value: '1', label: 'Pro', description: '$10/month' },
      ];
      render(<Radio options={optionsWithDesc} />);
      expect(screen.getByText('$10/month')).toBeInTheDocument();
    });
  });
});
