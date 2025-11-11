import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from '../Select';

const items = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders with combobox attributes', () => {
    const { container } = render(<Select items={items} />);
    const button = container.querySelector('[aria-haspopup="listbox"]');
    expect(button).toBeInTheDocument();
  });

  it('shows placeholder', () => {
    render(<Select items={items} placeholder="Choose option" />);
    expect(screen.getByText('Choose option')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<Select items={items} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selects option in single mode', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Select items={items} onChange={handleChange} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Option 2'));

    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('shows selected count in multiple mode', async () => {
    const user = userEvent.setup();
    render(<Select items={items} multiple />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Option 1'));
    await user.click(screen.getByText('Option 2'));

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('has checkboxes in multiple mode', async () => {
    const user = userEvent.setup();
    render(<Select items={items} multiple />);

    await user.click(screen.getByRole('button'));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select items={items} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles Enter key selection', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Select items={items} onChange={handleChange} />);

    await user.click(screen.getByRole('button'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<Select items={items} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Select items={items} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const selectButton = screen.getByRole('button');
    await user.click(selectButton);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Select items={items} />);

    await user.click(screen.getByRole('button'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('handles disabled items', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const itemsWithDisabled = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2', disabled: true },
      { value: '3', label: 'Option 3' },
    ];
    render(<Select items={itemsWithDisabled} onChange={handleChange} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Option 2'));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses defaultValue for uncontrolled mode', () => {
    render(<Select items={items} defaultValue="2" />);
    expect(screen.getByRole('button')).toHaveTextContent('Option 2');
  });

  it('handles multiple selection with array value', () => {
    render(
      <Select items={items} multiple value={['1', '2']} onChange={vi.fn()} />
    );
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
});
