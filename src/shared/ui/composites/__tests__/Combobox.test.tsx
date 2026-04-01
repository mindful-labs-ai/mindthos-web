import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from '../Combobox';

const items = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
];

describe('Combobox', () => {
  it('renders with combobox role', () => {
    render(<Combobox items={items} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows placeholder', () => {
    render(<Combobox items={items} placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters items on input', async () => {
    const user = userEvent.setup();
    render(<Combobox items={items} />);

    await user.type(screen.getByRole('combobox'), 'vue');
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  it('selects item on click', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox items={items} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('React'));

    expect(handleChange).toHaveBeenCalledWith('react');
  });

  it('shows "No results" when no matches', async () => {
    const user = userEvent.setup();
    render(<Combobox items={items} />);

    await user.type(screen.getByRole('combobox'), 'xyz');
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<Combobox items={items} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Combobox items={items} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('handles Enter key selection', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox items={items} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox items={items} />
        <button>Outside</button>
      </div>
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Combobox items={items} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('handles disabled items', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const itemsWithDisabled = [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue', disabled: true },
      { value: 'angular', label: 'Angular' },
    ];
    render(<Combobox items={itemsWithDisabled} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Vue'));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses custom filter function', async () => {
    const user = userEvent.setup();
    const customFilter = vi.fn((items) => items);
    render(<Combobox items={items} filterFn={customFilter} />);

    await user.type(screen.getByRole('combobox'), 'test');

    expect(customFilter).toHaveBeenCalled();
  });

  it('clears input and shows all items on click when closed', async () => {
    const user = userEvent.setup();
    render(<Combobox items={items} />);

    const combobox = screen.getByRole('combobox');
    await user.type(combobox, 'vue');
    expect(screen.getByText('Vue')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await user.click(combobox);

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('respects controlled value', () => {
    render(<Combobox items={items} value="react" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('React');
  });
});
