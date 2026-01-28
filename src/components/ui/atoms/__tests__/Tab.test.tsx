import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Tab } from '../Tab';

const items = [
  { value: 'tab1', label: 'Tab 1' },
  { value: 'tab2', label: 'Tab 2' },
  { value: 'tab3', label: 'Tab 3' },
];

describe('Tab', () => {
  it('renders all tabs', () => {
    render(<Tab items={items} />);
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
  });

  it('renders with tablist role', () => {
    render(<Tab items={items} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('switches tab on click', async () => {
    const user = userEvent.setup();
    render(<Tab items={items} />);

    await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('calls onChange with selected tab value', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Tab items={items} onValueChange={handleChange} />);

    await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
    expect(handleChange).toHaveBeenCalledWith('tab2');
  });

  it('respects controlled value', () => {
    render(<Tab items={items} value="tab2" onValueChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Tab items={items} defaultValue="tab1" />);

    const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
    firstTab.focus();

    await user.keyboard('{ArrowRight}');

    // Tab 2 should now be selected (aria-selected)
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('disables specific tab', () => {
    const itemsWithDisabled = [
      { value: 'tab1', label: 'Tab 1' },
      { value: 'tab2', label: 'Tab 2', disabled: true },
    ];
    render(<Tab items={itemsWithDisabled} />);
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('navigates with Home key', async () => {
    const user = userEvent.setup();
    render(<Tab items={items} defaultValue="tab3" />);

    const thirdTab = screen.getByRole('tab', { name: 'Tab 3' });
    thirdTab.focus();

    await user.keyboard('{Home}');

    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('navigates with End key', async () => {
    const user = userEvent.setup();
    render(<Tab items={items} defaultValue="tab1" />);

    const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
    firstTab.focus();

    await user.keyboard('{End}');

    expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('wraps navigation with ArrowRight', async () => {
    const user = userEvent.setup();
    render(<Tab items={items} defaultValue="tab3" />);

    const lastTab = screen.getByRole('tab', { name: 'Tab 3' });
    lastTab.focus();

    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('wraps navigation with ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<Tab items={items} defaultValue="tab1" />);

    const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
    firstTab.focus();

    await user.keyboard('{ArrowLeft}');

    expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('applies custom size', () => {
    const { container } = render(<Tab items={items} size="lg" />);
    const tab = container.querySelector('button[role="tab"]');
    expect(tab).toHaveClass('px-5', 'py-2.5', 'text-base');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Tab items={items} className="custom-class" />
    );
    // className은 tablist를 감싸는 외부 wrapper에 적용됨
    const wrapper = container.querySelector('[role="tablist"]')?.parentElement;
    expect(wrapper).toHaveClass('custom-class');
  });
});
