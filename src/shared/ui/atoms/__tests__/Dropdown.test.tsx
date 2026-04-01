import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dropdown } from '../Dropdown';

const items = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Dropdown', () => {
  it('renders with combobox role', () => {
    render(<Dropdown items={items} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows placeholder', () => {
    render(<Dropdown items={items} placeholder="Select option" />);
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selects option on click', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown items={items} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Option 2'));

    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('closes dropdown after selection', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Option 1'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('respects controlled value', () => {
    render(<Dropdown items={items} value="2" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Option 2');
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} />);

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    await user.keyboard('{ArrowDown}');

    // Dropdown should open on ArrowDown
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Dropdown items={items} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('navigates with arrow up', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} />);

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selects with Enter key', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown items={items} onChange={handleChange} />);

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('selects with Space key', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown items={items} onChange={handleChange} />);

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    await user.keyboard(' ');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes with Escape key', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports typeahead search', async () => {
    const user = userEvent.setup();
    const searchItems = [
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana' },
      { value: 'c', label: 'Cherry' },
    ];
    render(<Dropdown items={searchItems} />);

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('b');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Dropdown items={items} />
        <button>Outside</button>
      </div>
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('handles disabled items', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const itemsWithDisabled = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2', disabled: true },
      { value: '3', label: 'Option 3' },
    ];
    render(<Dropdown items={itemsWithDisabled} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Option 2'));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses defaultValue for uncontrolled mode', () => {
    render(<Dropdown items={items} defaultValue="2" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Option 2');
  });
});
