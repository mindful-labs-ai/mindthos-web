import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Dropdown } from './Dropdown';

const items = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
];

const meta = {
  title: 'Atoms/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items,
    placeholder: 'Select an option',
  },
};

export const WithDefaultValue: Story = {
  args: {
    items,
    defaultValue: '2',
  },
};

export const Disabled: Story = {
  args: {
    items,
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('');
      return (
        <div className="flex flex-col gap-4">
          <Dropdown items={items} value={value} onChange={setValue} />
          <p className="text-sm text-fg-muted">Selected: {value || 'None'}</p>
        </div>
      );
    };
    return <Component />;
  },
};
